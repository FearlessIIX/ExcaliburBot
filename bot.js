const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags, AttachmentBuilder } = require('discord.js');
const Canvas = require("@napi-rs/canvas");
const { token } = require('./config.json');

const { createCanvas, Image } = require('@napi-rs/canvas');
const { readFile } = require('fs/promises');
const { request } = require('undici');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Add collection to client containing commands
client.commands = new Collection();

// Get the Command folder path and the list of folders inside command folder
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Loop through all folders in command folder
for (const folder of commandFolders) {

	// Get list of all .js files in particular command subfolder
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	// Validate and register each .js file found
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});


client.on(Events.InteractionCreate, async interaction => {
	
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (interaction.commandName === "user") {

		let target = interaction.options.getUser("target")

		if (!target) target = interaction.user

		// Create the canvas for image manipulation, and grab its internal context
		const canvas = Canvas.createCanvas(1000, 500)
		const context = canvas.getContext("2d")


		// Grab the background image from the discords cdn servers
		const background = await Canvas.loadImage('https://cdn.discordapp.com/attachments/1384813905678696519/1385447411631132762/castleBackgroundImage.png?ex=6856c2b3&is=68557133&hm=168b283f95652b4404da0ee7a7f6604d7e7165090182ea3f56fc2cfb476d988d&');
		// Draw the image on the canvas context, ensuring its size is the same as the canvas
		context.drawImage(background, 0, 0, canvas.width, canvas.height);


		const avatarBarW = canvas.width / 3
		// Set alpha to 1/3, then make a background for avatar to sit on
		context.globalAlpha = 0.33
		context.fillStyle = "##c9a6a5"

		context.fillRect(0, 0, avatarBarW, canvas.height)

		context.globalAlpha = 1
		// Draw line to separate avatar from the rest of the banner
		context.fillRect(avatarBarW, 0, 3, canvas.height)


		
		// Calculate some needed coordinates and sizes for use with avatar placement
		const avatarSize = canvas.width / 4
		const avatarPosW = (avatarBarW / 2) - (avatarSize / 2)
		const avatarPosH = (canvas.height / 2) - (avatarSize / 2)
		const clippingRadius = avatarSize / 2


		// Grab the users avatar, and load it
		const avatar = await Canvas.loadImage(target.displayAvatarURL({ extension: "png" }));

		// Save the context so we can continue unclipped after drawing avatar
		context.save()

		// Clip the drawing area to just inside the circle
		context.beginPath()
		// Drawing circle the desired size and shape of avatar
		context.arc(avatarPosW + (avatarSize / 2), avatarPosH + (avatarSize / 2), clippingRadius, 0, Math.PI * 2, true)
		// Close the path and clip context.
		context.closePath()
		context.clip();

		// Finally draw the avatar onto the canvas, limited by our previous clip. Then restore the old context
		context.drawImage(avatar, avatarPosW, avatarPosH, avatarSize, avatarSize);
		context.restore()


		// Build the final attachment for sending
		const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });
		// Send the attachment
		interaction.reply({ files: [attachment] });

		// We are done processing this interaction
		return;
	}

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
	}
});

client.login(token);

//1384802562376728616
//1170537864099008582