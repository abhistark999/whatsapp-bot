const { create, Client } = require('@open-wa/wa-automate')
const figlet = require('figlet')
const options = require('./utils/options')
const { color, messageLog } = require('./utils')
const HandleMsg = require('./HandleMsg')

const start = (aruga = new Client()) => {
    console.log(color(figlet.textSync('----------------', { horizontalLayout: 'default' })))
    console.log(color(figlet.textSync('ARUGA BOT', { font: 'Ghost', horizontalLayout: 'default' })))
    console.log(color(figlet.textSync('----------------', { horizontalLayout: 'default' })))
    console.log(color('[DEV]'), color('ArugaZ', 'yellow'))
    console.log(color('[~>>]'), color('BOT Started!', 'green'))

    // Keeps the session on
    aruga.onStateChanged((state) => {
        console.log(color('[~>>]', 'red'), state)
        if (state === 'CONFLICT' || state === 'UNLAUNCHED') aruga.forceRefocus()
    })

    // when bots are invited into groups
    aruga.onAddedToGroup(async (chat) => {
	const groups = await aruga.getAllGroups()
	// When the bot group limit is reached, change it in the settings / settings.json file
	if (groups.length > groupLimit) {
	await aruga.sendText(chat.id, `Sorry, This bot is already in Many Groups\nMax Group is: ${groupLimit}`).then(() => {
	      aruga.leaveGroup(chat.id)
	      aruga.deleteChat(chat.id)
	  }) 
	} else {
	// condition when the group member limit has not been reached, change it in the file settings / settings.json
	    if (chat.groupMetadata.participants.length < memberLimit) {
	    await aruga.sendText(chat.id, `Sorry, BOT Will Not stay If members On this group do not exceed ${memberLimit} people`).then(() => {
	      aruga.leaveGroup(chat.id)
	      aruga.deleteChat(chat.id)
	    })
	    } else {
        await aruga.simulateTyping(chat.id, true).then(async () => {
          await aruga.sendText(chat.id, `Hey minna~, Im ELITe BOT. To find out the commands on this bot type ${prefix}menu`)
        })
	    }
	}
    })

    // when someone enters / leaves the group
    aruga.onGlobalParicipantsChanged(async (event) => {
        const host = await aruga.getHostNumber() + '@c.us'
		let profile = await aruga.getProfilePicFromServer(event.who)
		if (profile == '' || profile == undefined) profile = 'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTQcODjk7AcA4wb_9OLzoeAdpGwmkJqOYxEBA&usqp=CAU'
        // When someone invites / joins the group via the link
        if (event.action === 'add' && event.who !== host) {
			await aruga.sendFileFromUrl(event.chat, profile, 'profile.jpg', '')
            await aruga.sendTextWithMentions(event.chat, `Hello, Welcome to the group @${event.who.replace('@c.us', '')} \n\nHave fun with us✨`)
        }
        // when someone is kicked / left the group
        if (event.action === 'remove' && event.who !== host) {
			await aruga.sendFileFromUrl(event.chat, profile, 'profile.jpg', '')
            await aruga.sendTextWithMentions(event.chat, `Good bye @${event.who.replace('@c.us', '')}, We'll miss you✨`)
        }
    })

    aruga.onIncomingCall(async (callData) => {
        // when someone calls the number the bot will send a message
        await aruga.sendText(callData.peerJid, 'Sorry, Receiving calls is restricted by my owner.\n\n Please do not call this number')
        .then(async () => {
            // the bot will block that number
            await aruga.contactBlock(callData.peerJid)
        })
    })

    // when someone sends a message
    aruga.onMessage(async (message) => {
        aruga.getAmountOfLoadedMessages() // clear message cache if already 3000 messages.
            .then((msg) => {
                if (msg >= 3000) {
                    console.log('[aruga]', color(`! Maximum Loaded messages Limit ! reached ${msg}, Clearing Messages Cache...`, 'yellow'))
                    aruga.cutMsgCache()
                }
            })
        HandleMsg(aruga, message)    
    
    })
	
    // Message log for analytic
    aruga.onAnyMessage((anal) => { 
        messageLog(anal.fromMe, anal.type)
    })
}

//create session
create(options(true, start))
    .then((aruga) => start(aruga))
    .catch((err) => new Error(err))
