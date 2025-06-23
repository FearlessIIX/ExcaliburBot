const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags, AttachmentBuilder, ClientVoiceManager } = require('discord.js');
const Canvas = require("@napi-rs/canvas");
const { token } = require('./config.json');

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

		try {
			const targetGuild = interaction.guild


			let target = await targetGuild.members.fetch(interaction.options.getUser("target").id)

			if (!target) target = interaction.user

			// Create the canvas for image manipulation, and grab its internal context
			const canvas = Canvas.createCanvas(1000, 500)
			const context = canvas.getContext("2d")

			// Background Image ----------
			// Grab the background image from the discords cdn servers
			const background = await Canvas.loadImage('./assets/castleBackgroundImage.png');
			// Draw the image on the canvas context, ensuring its size is the same as the canvas
			context.drawImage(background, 0, 0, canvas.width, canvas.height);


			// Profile Picture Backing Bar ----------
			const avatarBarW = canvas.width / 3
			// Set alpha to 1/3, then make a background for avatar to sit on
			context.globalAlpha = 0.33

			// If you are a special person, your name will come up as a different color
			if (target.id == "528476089941491713") {
				context.fillStyle = "#15EAED"
			}
			else if (target.id == "541001349651890176") {
				context.fillStyle = "#4F0606"
			}
			else {
				context.fillStyle = "#c9a6a5"
			}

			context.fillRect(0, 0, avatarBarW, canvas.height)

			context.globalAlpha = 1
			// Draw line to separate avatar from the rest of the banner
			context.fillRect(avatarBarW, 0, 3, canvas.height)


			// Calculate some needed coordinates and sizes for use with avatar placement
			const avatarSize = canvas.width / 4
			const avatarPosW = (avatarBarW / 2) - (avatarSize / 2)
			const avatarPosH = (canvas.height / 2) - (avatarSize / 2)
			const clippingRadius = avatarSize / 2


			// Target Avatar ----------
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
			

			context.font = "50px serif"
			const textWidth = context.measureText(target.displayName).width
			const textPlacementLocation = (canvas.width / 3 + (canvas.width - canvas.width / 3) / 2) - textWidth / 2

			context.fillText(target.displayName, textPlacementLocation, 50)


			const centerPointX = canvas.width / 3 + (canvas.width - canvas.width / 3) / 2
			const centerPointY = canvas.height / 2

			const strokeLen = (canvas.width - canvas.width / 3) / 4

			context.lineWidth = 4


			const mm = 0 - strokeLen
			const pp = 0 + strokeLen
			const p = 0 + strokeLen / 2
			const m = 0 - strokeLen / 2


			// Begin drawing stat crystal
			context.beginPath()
			context.moveTo(centerPointX + mm, centerPointY + m)

			context.lineTo(centerPointX + mm, centerPointY + p)
			context.lineTo(centerPointX, centerPointY + pp)
			context.lineTo(centerPointX + pp, centerPointY + p)
			context.lineTo(centerPointX + pp, centerPointY + m)
			context.lineTo(centerPointX, centerPointY + mm)
			context.lineTo(centerPointX + mm, centerPointY + m)

			// finish and fill stat crystal
			context.closePath()

			context.globalAlpha = 0.33
			context.fill()

			context.globalAlpha = 1
			context.stroke()

			context.beginPath()
			context.moveTo(centerPointX, centerPointY)
			context.lineTo(centerPointX + mm, centerPointY + p)

			context.moveTo(centerPointX, centerPointY)
			context.lineTo(centerPointX, centerPointY + pp)

			context.moveTo(centerPointX, centerPointY)
			context.lineTo(centerPointX + pp, centerPointY + p)

			context.moveTo(centerPointX, centerPointY)
			context.lineTo(centerPointX + pp, centerPointY + m)

			context.moveTo(centerPointX, centerPointY)
			context.lineTo(centerPointX, centerPointY + mm)

			context.moveTo(centerPointX, centerPointY)
			context.lineTo(centerPointX + mm, centerPointY + m)

			context.closePath()
			context.stroke()


			// If you are a special person, your name will come up as a different color
			if (target.id == "528476089941491713" || target.id == "541001349651890176") {
				context.fillStyle = (target.id == "528476089941491713") ? "#FFFFFF" : "#A62C2B"
			}

			// Insert stat bars into crystal, each one requires its own code smh
			context.beginPath()
			context.moveTo(centerPointX, centerPointY)

			// TODO: Later we will grab user stat percentages in this area
			let statPercentage = 0.75

			context.lineTo(centerPointX + mm * statPercentage, centerPointY + m * statPercentage)
			context.lineTo(centerPointX + mm * statPercentage, centerPointY + p * statPercentage)
			context.lineTo(centerPointX, centerPointY)

			context.closePath()

			context.globalAlpha = 0.75
			context.fill()
			context.globalAlpha = 1

			context.stroke()

			context.beginPath()
			context.moveTo(centerPointX, centerPointY)


			// TODO: Later we will grab user stat percentages in this area
			statPercentage = 0.9

			context.lineTo(centerPointX + mm * statPercentage, centerPointY + p * statPercentage)
			context.lineTo(centerPointX, centerPointY + pp * statPercentage)
			context.lineTo(centerPointX, centerPointY)

			context.closePath()

			context.globalAlpha = 0.75
			context.fill()
			context.globalAlpha = 1

			context.stroke()

			context.beginPath()
			context.moveTo(centerPointX, centerPointY)


			// TODO: Later we will grab user stat percentages in this area
			statPercentage = 0.65

			context.lineTo(centerPointX, centerPointY + pp * statPercentage)
			context.lineTo(centerPointX + pp * statPercentage, centerPointY + p * statPercentage)
			context.lineTo(centerPointX, centerPointY)

			context.closePath()

			context.globalAlpha = 0.75
			context.fill()
			context.globalAlpha = 1

			context.stroke()

			context.beginPath()
			context.moveTo(centerPointX, centerPointY)


			// TODO: Later we will grab user stat percentages in this area
			statPercentage = 0.1

			context.lineTo(centerPointX + pp * statPercentage, centerPointY + p * statPercentage)
			context.lineTo(centerPointX + pp * statPercentage, centerPointY + m * statPercentage)
			context.lineTo(centerPointX, centerPointY)

			context.closePath()

			context.globalAlpha = 0.75
			context.fill()
			context.globalAlpha = 1

			context.stroke()

			context.beginPath()
			context.moveTo(centerPointX, centerPointY)


			// TODO: Later we will grab user stat percentages in this area
			statPercentage = 0.3

			context.lineTo(centerPointX + pp * statPercentage, centerPointY + m * statPercentage)
			context.lineTo(centerPointX, centerPointY + mm * statPercentage)
			context.lineTo(centerPointX, centerPointY)

			context.closePath()

			context.globalAlpha = 0.75
			context.fill()
			context.globalAlpha = 1

			context.stroke()

			context.beginPath()
			context.moveTo(centerPointX, centerPointY)


			// TODO: Later we will grab user stat percentages in this area
			statPercentage = 1

			context.lineTo(centerPointX, centerPointY + mm * statPercentage)
			context.lineTo(centerPointX + mm * statPercentage, centerPointY + m * statPercentage)
			context.lineTo(centerPointX, centerPointY)

			context.closePath()

			context.globalAlpha = 0.75
			context.fill()
			context.globalAlpha = 1

			context.stroke()


			// If you are a special person, your name will come up as a different color
			if (target.id == "528476089941491713" || target.id == "541001349651890176") {
				context.fillStyle = (target.id == "528476089941491713") ? "#15EAED" : "#4F0606"

				context.globalAlpha = 0.15
				context.fillRect(0,0, canvas.width, canvas.height)
			}


			// Build the final attachment for sending
			const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });
			// Send the attachment
			interaction.reply({ files: [attachment] });

			// We are done processing this interaction
			return;
		} catch(error) {
			console.log(error)
			interaction.followUp("There was an error while running this command")
		}


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

//Strength
//Intellect
//Agility
//Vitality
//Perception
//Technique