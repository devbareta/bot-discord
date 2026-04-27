require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  Events,
  EmbedBuilder
} = require("discord.js");

const fs = require("fs");

// CONFIG
const TOKEN = "MTQ3MTM5NTIwMzg5MzAzOTI1Ng.GQTYUX.QKo7Kbefo0K4RlCxh1tQMSr4mqFk02SUpsZ0Ww";
const GUILD_ID = process.env.GUILD_ID;

// DATABASE
const path = "./database/users.json";
if (!fs.existsSync("./database")) fs.mkdirSync("./database");
if (!fs.existsSync(path)) fs.writeFileSync(path, "{}");

// CORES
const cores = {
  vermelho: 0xE74C3C,
  azul: 0x3498DB,
  verde: 0x2ECC71,
  amarelo: 0xF1C40F,
  roxo: 0x9B59B6,
  laranja: 0xE67E22
};

// CLIENT
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// READY
client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot online: ${client.user.tag}`);

  const commands = [

    new SlashCommandBuilder()
      .setName("publicar")
      .setDescription("Criar postagem")
      .addStringOption(o =>
        o.setName("tipo").setDescription("Tipo").setRequired(true)
        .addChoices(
          { name: "Urgente", value: "urgente" },
          { name: "Escândalo", value: "escandalo" },
          { name: "Positiva", value: "positiva" },
          { name: "Política", value: "politica" },
          { name: "Economia", value: "economia" }
        )
      )
      .addStringOption(o =>
        o.setName("mensagem").setDescription("Mensagem").setRequired(true)
      )
      .addStringOption(o =>
        o.setName("cor").setDescription("Cor")
        .addChoices(
          { name: "Vermelho", value: "vermelho" },
          { name: "Azul", value: "azul" },
          { name: "Verde", value: "verde" },
          { name: "Amarelo", value: "amarelo" },
          { name: "Roxo", value: "roxo" },
          { name: "Laranja", value: "laranja" }
        )
      )
      .addRoleOption(o =>
        o.setName("cargo").setDescription("Cargo para marcar")
      ),

    new SlashCommandBuilder()
      .setName("perfil")
      .setDescription("Ver perfil"),

    new SlashCommandBuilder()
      .setName("ranking")
      .setDescription("Ranking"),

    new SlashCommandBuilder()
      .setName("ajudatv")
      .setDescription("Ajuda do sistema")

  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(client.user.id, GUILD_ID),
    { body: commands }
  );

  console.log("✅ Comandos registrados!");
});

// DB
function getDB() {
  return JSON.parse(fs.readFileSync(path));
}
function saveDB(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

// INTERAÇÕES
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  let db = getDB();
  const id = interaction.user.id;

  if (!db[id]) {
    db[id] = { dinheiro: 0, seguidores: 0, popularidade: 0 };
  }

  // PUBLICAR
  if (interaction.commandName === "publicar") {

    const tipo = interaction.options.getString("tipo");
    const texto = interaction.options.getString("mensagem");
    const cor = interaction.options.getString("cor");
    const cargo = interaction.options.getRole("cargo");

    let valor = Math.floor(Math.random() * (30000 - 18000 + 1)) + 18000;
    let seguidores = Math.floor(Math.random() * 2000);
    let popularidade = Math.floor(Math.random() * 5);
    let status = "✅ Sucesso";

    if (tipo === "urgente") seguidores += 1000;
    if (tipo === "escandalo") {
      valor += 8000;
      popularidade -= 3;
    }

    const chance = Math.random();
    if (chance < 0.15) {
      valor *= 2;
      seguidores *= 2;
      status = "🔥 VIRAL!";
    } else if (chance < 0.30) {
      valor = -10000;
      seguidores = -500;
      status = "❌ FLOPOU";
    }

    db[id].dinheiro += valor;
    db[id].seguidores += seguidores;
    db[id].popularidade += popularidade;
    saveDB(db);

    const embed = new EmbedBuilder()
      .setTitle(`📺 ${tipo.toUpperCase()}`)
      .setDescription(texto)
      .setColor(cores[cor] || 0x2C3E50)
      .addFields(
        { name: "💰 Dinheiro", value: `R$ ${valor.toLocaleString("pt-BR")}`, inline: true },
        { name: "📈 Seguidores", value: `${seguidores}`, inline: true },
        { name: "⭐ Popularidade", value: `${popularidade}`, inline: true },
        { name: "📊 Resultado", value: status }
      );

    const msg = await interaction.reply({
      content: cargo ? `${cargo}` : undefined,
      embeds: [embed],
      fetchReply: true,
      allowedMentions: { roles: cargo ? [cargo.id] : [] }
    });

    const reacts = ["👍","❤️","🔥","👏","👎","😡"];
    for (const r of reacts) await msg.react(r);
  }

  // PERFIL
  if (interaction.commandName === "perfil") {
    const user = db[id];

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("📺 Perfil")
          .addFields(
            { name: "💰 Dinheiro", value: `R$ ${user.dinheiro}` },
            { name: "📈 Seguidores", value: `${user.seguidores}` },
            { name: "⭐ Popularidade", value: `${user.popularidade}` }
          )
      ]
    });
  }

  // RANKING
  if (interaction.commandName === "ranking") {
    const ranking = Object.entries(db)
      .sort((a, b) => b[1].seguidores - a[1].seguidores)
      .slice(0, 10);

    const texto = ranking.map((u, i) =>
      `**${i+1}º** <@${u[0]}> - ${u[1].seguidores}`
    ).join("\n");

    interaction.reply({
      embeds: [new EmbedBuilder().setTitle("🏆 Ranking").setDescription(texto)]
    });
  }

  // AJUDA
  if (interaction.commandName === "ajudatv") {
    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("📺 Ajuda TV")
          .setDescription("Use /publicar para ganhar dinheiro e crescer!")
      ],
      ephemeral: true
    });
  }

});

client.login("MTQ3MTM5NTIwMzg5MzAzOTI1Ng.GQTYUX.QKo7Kbefo0K4RlCxh1tQMSr4mqFk02SUpsZ0Ww");