/**
 * Discord Prayer Times Bot
 * 
 * Setup:
 *   npm install discord.js axios @napi-rs/canvas dotenv
 *   Copy .env.example → .env and fill in TOKEN + CLIENT_ID
 *   Place bg.png in this folder
 *   node index.js
 */
require('dotenv').config();
const {
  Client, GatewayIntentBits, REST, Routes,
  SlashCommandBuilder, AttachmentBuilder,
  ChannelType
} = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');
const path = require('path');
const axios = require('axios');
const { generatePrayerImage } = require('./prayerImage');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezonePlugin = require('dayjs/plugin/timezone');


dayjs.extend(utc);
dayjs.extend(timezonePlugin);
const ADHAN_FILE = path.join(__dirname, '/Assests/voice.mp3');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const latitude = "31.7767";
const longitude = "35.2345";
const timezone = "Asia%2FJerusalem";  // if you want it manual
const timezonestring = "Asia/Jerusalem";

if (!TOKEN || !CLIENT_ID) {
  console.error('❌ Set DISCORD_TOKEN and CLIENT_ID in .env');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// ── Adhan scheduler ──────────────────────────────────────────────────────────
const playedAdhans = new Set();

/**
 * Plays voice.mp3 sequentially in every populated voice channel across all guilds.
 * Channels are processed one at a time so audio never overlaps.
 */

async function playAdhanInAllChannels() {
  const targets = [];
  for (const guild of client.guilds.cache.values()) {
    const channels = guild.channels.cache.filter(
      ch =>
        ch.type === ChannelType.GuildVoice &&
        ch.members.filter(m => !m.user.bot).size > 0
    );
    for (const ch of channels.values()) {
      targets.push(ch);
    }
  }

  if (targets.length === 0) {
    console.log('🔇 No populated voice channels found — skipping adhan.');
    return;
  }

  console.log(`📢 Playing adhan in ${targets.length} channel(s) sequentially...`);

  for (const channel of targets) {
    await playAdhanInChannel(channel);
  }

  console.log('✅ Adhan finished in all channels.');
}

/**
 * Joins a single voice channel, plays the mp3 to the end, then leaves.
 * Returns a Promise that resolves when playback is done (or on error).
 */
function playAdhanInChannel(channel) {
  return new Promise(resolve => {
    let connection;
    try {
      connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false
      });
    } catch (err) {
      console.error(`❌ Could not join ${channel.name}:`, err.message);
      return resolve();
    }

    const player = createAudioPlayer();
    const resource = createAudioResource(ADHAN_FILE);

    // Disconnect and resolve once the track finishes
    player.on(AudioPlayerStatus.Idle, () => {
      console.log(`✅ Adhan done in #${channel.name} (${channel.guild.name})`);
      connection.destroy();
      resolve();
    });

    player.on('error', err => {
      console.error(`❌ Player error in #${channel.name}:`, err.message);
      connection.destroy();
      resolve();
    });

    // Start playing once the connection is ready
    entersState(connection, VoiceConnectionStatus.Ready, 10_000)
      .then(() => {
        connection.subscribe(player);
        player.play(resource);
        console.log(`▶️  Playing adhan in #${channel.name} (${channel.guild.name})`);
      })
      .catch(err => {
        console.error(`❌ Connection not ready for #${channel.name}:`, err.message);
        connection.destroy();
        resolve();
      });
  });
}

/**
 * Called once after the bot is ready.
 * Fetches today's prayer times, then poles every 30 s to check
 * whether any prayer is exactly 5 minutes away.
 */
async function startAdhanScheduler() {
  let prayerTimes = null;
  let lastFetchDate = null;

  async function refreshIfNeeded() {
    const today = new Date().toDateString();
    if (lastFetchDate !== today) {
      try {
        prayerTimes = await fetchPrayerData();
        lastFetchDate = today;
        console.log('🕐 Prayer times loaded for adhan scheduler:', prayerTimes);
      } catch (e) {
        console.error('❌ Scheduler failed to fetch prayer times:', e.message);
      }
    }
  }

async function updateBotStatus(prayers) {
  if (!prayers) return;

  const now = dayjs().tz(timezonestring);
  const nowMin = now.hour() * 60 + now.minute();
  
  let nearest = null;
  let smallestDiff = Infinity;

  for (const prayer of prayers) {
    if (!prayer.time || prayer.time === '--:--') continue;
    
    const [h, m] = prayer.time.split(':').map(Number);
    const prayerMin = h * 60 + m;
    const diff = prayerMin - nowMin;

    if (diff > 0 && diff < smallestDiff) {
      smallestDiff = diff;
      nearest = prayer;
    }
  }

  if (!nearest) {
    nearest = prayers[0];
  }

  const arabicNames = {
    fajr: 'الفجر',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء'
  };

  const arabicName = arabicNames[nearest.name] || nearest.name;
  const statusText = `يترقب صلاة ${arabicName} ${nearest.time}`;

  client.user.setPresence({
    activities: [{ name: statusText, type: 3 }],
    status: 'idle'
  });

  console.log(`🟢 Bot status updated: ${statusText} (Current Time: ${now.format('HH:mm')})`);
}
  async function tick() {
    await refreshIfNeeded();
    if (!prayerTimes) return;

    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: 'fajr', time: prayerTimes.fajr },
      { name: 'dhuhr', time: prayerTimes.dhuhr },
      { name: 'asr', time: prayerTimes.asr },
      { name: 'maghrib', time: prayerTimes.maghrib },
      { name: 'isha', time: prayerTimes.isha },
    ];

    for (const prayer of prayers) {
      if (!prayer.time || prayer.time === '--:--') continue;

      const [h, m] = prayer.time.split(':').map(Number);
      const prayerMin = h * 60 + m;
      const diffMin = prayerMin - nowMin;

      const key = `${now.toDateString()}-${prayer.name}`;
      if (diffMin === 5 && !playedAdhans.has(key)) {
        playedAdhans.add(key);
        console.log(`🕌 5 minutes until ${prayer.name} — starting adhan broadcast...`);
        playAdhanInAllChannels().catch(console.error);
      }
    }
  }

  function getPrayersArray() {
    if (!prayerTimes) return null;
    return [
      { name: 'fajr',    time: prayerTimes.fajr },
      { name: 'dhuhr',   time: prayerTimes.dhuhr },
      { name: 'asr',     time: prayerTimes.asr },
      { name: 'maghrib', time: prayerTimes.maghrib },
      { name: 'isha',    time: prayerTimes.isha },
    ];
  }
  setInterval(tick, 30_000);
  tick(); 
  setInterval(() => updateBotStatus(getPrayersArray(), new Date()), 120_000);
  refreshIfNeeded().then(() => updateBotStatus(getPrayersArray(), new Date()));
}

// ── Register slash command ────────────────────────────────────────────────────
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const cmds = [
    new SlashCommandBuilder()
      .setName('مواقيت_الصلاة')
      .setDescription('📿 مواقيت الصلاة في القدس الشريف')
      .toJSON(),
    new SlashCommandBuilder()
      .setName('تجربة_التذكير')
      .setDescription('🏓 تجربة تذكير الأذان قبل 5 دقائق')
      .toJSON()
  ];
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: cmds });
    console.log('✅ Slash commands registered');
  } catch (e) {
    console.error('❌ Failed to register commands:', e.message);
  }
}

// ── Fetch from Aladhan API ────────────────────────────────────────────────────
async function fetchPrayerData() {
  const now = new Date();
  const url = `https://api.aladhan.com/v1/timings/${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}` +
    `?latitude=${latitude}&longitude=${longitude}&method=5&timezonestring=${timezone}&tune=0,0,0,0,0,5,0,0,0`;;

  const { data } = await axios.get(url, { timeout: 10_000 });
  const t = data.data.timings;
  const h = data.data.date.hijri;

  const clean = s => (s || '--:--').split(' ')[0];

  return {
    fajr: clean(t.Fajr),
    dhuhr: clean(t.Dhuhr),
    asr: clean(t.Asr),
    maghrib: clean(t.Maghrib),
    isha: clean(t.Isha),
    hijriText: `${h.weekday.ar} ${h.day} ${h.month.ar} ${h.year}`
  };
}

// ── Events ────────────────────────────────────────────────────────────────────
client.once('clientReady', async () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
  await registerCommands();
  startAdhanScheduler();
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'مواقيت_الصلاة') return;

  await interaction.deferReply();

  try {
    const data = await fetchPrayerData();
    const imgBuffer = await generatePrayerImage(data);
    const file = new AttachmentBuilder(imgBuffer, { name: 'prayer-times.png' });

    await interaction.editReply({ content: "** مواقيت الصلاة **", files: [file] });
    console.log(`✅ Sent prayer times to ${interaction.user.tag}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    await interaction.editReply('❌ حدث خطأ أثناء جلب مواقيت الصلاة. حاول مرة أخرى.');
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'تجربة_التذكير') return;
  console.log(`🕌 5 minutes until Test — starting adhan broadcast...`);
  playAdhanInAllChannels().catch(console.error);

});

client.login(TOKEN);