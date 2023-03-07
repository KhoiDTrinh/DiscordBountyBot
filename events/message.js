const { Events } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;
const { writeFile } = require('node:fs');

function updatePingHistory(ping_history) {
    let currentTime = Date.now();
    for (const mob of Object.keys(ping_history)) {
        for (const timestamp of ping_history[mob]) {
            if (currentTime > timestamp) {
                const index = ping_history[mob].indexOf(timestamp);
                ping_history[mob].splice(index, 1);
            }
        }
        if (ping_history[mob].length === 0) {
            delete ping_history[mob];
        }
    }
}

function updatePingHistoryFile(ping_history) {
    updatePingHistory(ping_history);

    writeFile('./jsons/ping_history.json', JSON.stringify(ping_history, null, 2), (err) => {
        if (err) {
            console.log('An error has occured updating the ping_history.json file', err)
        } else {
            console.log('ping_history.json successfully updated');
        }
    });
}

function calculateTimeRemaining(line) {
    let milliseconds = 0;
    const time_arr = line.trim().split(' ').filter(i => i);
    let index = time_arr.indexOf('s.');
    if (index > 0) {
        try {
            milliseconds += parseInt(time_arr[index - 1]) * 1000;
        } catch (err) {
            console.log('Error in calculating bounty timer');
            console.log(time_arr.join('-'));
        }
    }

    index = time_arr.indexOf('min.');
    if (index > 0) {
        try {
            milliseconds += parseInt(time_arr[index - 1]) * 60 * 1000;
        } catch (err) {
            console.log('Error in calculating bounty timer');
        }
    }

    index = time_arr.indexOf('h.');
    if (index > 0) {
        try {
            milliseconds += parseInt(time_arr[index - 1]) * 60 * 60 * 1000;
        } catch (err) {
            console.log('Error in calculating bounty timer');
        }
    }
    return milliseconds;
}

function getMobs(messageLines, ping_history) {
    let mobs = new Array();
    for (let i = 0; i < messageLines.length; i++) {
        const line = messageLines[i].trim();
        if (line.length == 0)
            continue;

        const arr = line.split(' ').filter(i => i);
        if (arr.length < 3 || arr[1] != 'LVL')
            continue;

        let mob_name = arr.slice(2).join(' ');

        let milliseconds = 0;
        if (i != messageLines.length - 1) {
            i++;
            milliseconds = calculateTimeRemaining(messageLines[i]);
        }

        mobs.push({ name: mob_name, time: milliseconds });
    }

    return filterMobsToPing(mobs, ping_history);
}

function filterMobsToPing(mobsToPing, ping_history) {
    let currentTime = Date.now();
    let filteredMobsToPing = new Array();
    for (const mobToPing of mobsToPing) {
        const thisPingTime = currentTime + mobToPing.time;
        let addMob = true;

        if (ping_history.hasOwnProperty(mobToPing.name) && mobToPing.time != 0) {
            for (const prevPingTime of ping_history[mobToPing.name]) {
                const timeDifference = prevPingTime - thisPingTime;
                if (timeDifference < 300000 && timeDifference > -300000) {
                    addMob = false;
                    break;
                }
            }
        } else {
            if (mobToPing.time != 0) {
                ping_history[mobToPing.name] = [];
            }
        }

        if (addMob) {
            if (mobToPing.time != 0) {
                ping_history[mobToPing.name].push(thisPingTime);
            }

            filteredMobsToPing.push(mobToPing);
        }
    }

    return filteredMobsToPing;
}

function getUsersToPing(bounty_preferences, bountydone, mobsToPing) {
    checkBountydoneNewDay(bountydone);

    let currentTime = new Date();
    let hour = currentTime.getUTCHours();
    let minutes = currentTime.getUTCMinutes();

    const usersToPing = new Object();
    for (const id of Object.keys(bounty_preferences)) {
        if (bountydone.arr.includes(id))
            continue;
        if (checkbountyhours_inactivetime(bounty_preferences[id], hour, minutes))
            continue;
        const target_list = bounty_preferences[id].bounties;
        for (const mobToPing of mobsToPing) {
            if (target_list.includes(mobToPing.name)) {
                if (usersToPing.hasOwnProperty(id)) {
                    usersToPing[id].push(mobToPing.name);
                } else {
                    usersToPing[id] = [mobToPing.name];
                }
            }
        }
    }
    return usersToPing;
}

function checkbountyhours_inactivetime(user_preferences, hour, minutes) {
    //True means inactive so don't ping

    if (!user_preferences.hasOwnProperty("bountyhours"))
        return false;

    let starthour = user_preferences.bountyhours.starthour;
    let startminutes = user_preferences.bountyhours.startminutes;
    let endhour = user_preferences.bountyhours.endhour;
    let endminutes = user_preferences.bountyhours.endminutes;

    if (starthour == endhour && startminutes == endminutes)
        return true;

    let startbeforeend = true;      //Two possibilities, start time before end time or end time before start time
    if (endhour < starthour || (endhour == starthour && endminutes < startminutes))
        startbeforeend = false;

    if (startbeforeend) {
        if (hour < starthour)
            return true;
        if (hour == starthour && minutes < startminutes)
            return true;
        if (hour > endhour)
            return true;
        if (hour == endhour && minutes > endminutes)
            return true;
        return false;
    }
    else {
        if (hour > starthour)
            return false;
        if (hour == starthour && minutes > startminutes)
            return false;
        if (hour < endhour)
            return false;
        if (hour == endhour && minutes < endminutes)
            return false;
        return true;
    }

    return false;
}

function checkBountydoneNewDay(bountydone) {
    let currentTime = new Date();
    let year = currentTime.getUTCFullYear();
    let month = currentTime.getUTCMonth();
    let date = currentTime.getUTCDate();
    let dateChanged = false;
    if (bountydone.date != date || bountydone.month != month || bountydone.year != year) {
        bountydone.date = date;
        bountydone.month = month;
        bountydone.year = year;
        bountydone.arr = [];
        dateChanged = true;
    }
    console.log('bountydone: current date = ', year, month, date, ', dateChanged = ', dateChanged);

    writeFile('./jsons/bountydone.json', JSON.stringify(bountydone, null, 2), (err) => {
        if (err) {
            console.log('An error has occured updating the bountydone.json file', err)
        } else {
            console.log('bountydone.json successfully updated');
        }
    });
}

function checkBountyMessage(message) {
    const messageLines = message.content.split('\n');
    if (messageLines.length <= 0) {
        return;
    }

    const mobsToPing = getMobs(messageLines, message.client.ping_history);
    if (mobsToPing.length == 0)
        return;
    const usersToPing = getUsersToPing(message.client.bounty_preferences, message.client.bountydone, mobsToPing);
    if (usersToPing.length == 0)
        return;

    const channel = message.client.channels.cache.get(message.channelId);
    for (const id of Object.keys(usersToPing)) {
        if (id == message.author.id)
            continue;

        let str = '<@' + id + '> ';
        str += usersToPing[id].join(', ');
        try {
            channel.send(str);
            console.log(str);
        } catch (err) {
            console.log(`Failed to ping ${id} in channel ${message.channelId}`);
            console.log(err);
        }
    }

    updatePingHistoryFile(message.client.ping_history);
}

async function checkHellMessage(message) {
    try {
        const channel = message.client.channels.cache.get(message.channelId);

        const hellRoleId = "813430276801036338";

        const checkTimeStamp = message.content.split(']');

        if (checkTimeStamp.length <= 1)
            return;
        if (!checkTimeStamp[1].includes("Event: Gates of Hell will open in 10 minutes") || checkTimeStamp[0].indexOf('[') != 0)
            return;

        if (message.client.hasOwnProperty('hell') && message.client.hell == true)
            return;
        message.client.hell = true;

        const timeArr = checkTimeStamp[0].slice(1).split(':');
        const currentTime = new Date();
        const eventNotificationTime = new Date(Date.UTC(
            currentTime.getUTCFullYear(),
            currentTime.getUTCMonth(),
            currentTime.getUTCDate(),
            parseInt(timeArr[0]),
            parseInt(timeArr[1]),
            parseInt(timeArr[2])
        ));;

        let waitTime = eventNotificationTime.getTime() + 10 * 60 * 1000 - Date.now();
        if (parseInt(timeArr[0]) == 23 && parseInt(timeArr[1]) >= 50 && currentTime.getUTCHours() != 23) {
            waitTime -= 1000 * 60 * 60 * 24;
        }

        let str = '<@&' + hellRoleId + '> opening in ' + Math.round(waitTime / 1000 / 60 * 10) / 10 + ' minutes';
        channel.send(str);
        console.log(str);

        await wait(waitTime);

        str = '<@&' + hellRoleId + '> is open';
        channel.send(str);
        console.log(str);
        message.client.hell = false;
    }
    catch (err) {
        console.log('Error in processing Hell Notification');
        console.log(err);
    }
}

async function checkEventMessage(message) {
    try {
        const channel = message.client.channels.cache.get(message.channelId);
        const eventRoleId = "813430280583905321";

        if (!message.content.includes("Event: Snowman appeared in the Ice Plains. [Ice Plains]") &&
            !message.content.includes("Event: Treant Elder appeared in the Reaper's Garden. [Reaper's Garden]")
        )
            return;

        if (message.client.hasOwnProperty('event') && message.client.event == true)
            return;
        message.client.event = true;

        str = '<@&' + eventRoleId + '>';
        channel.send(str);
        console.log(str);

        await wait(5 * 60 * 1000);
        message.client.event = false;
    }
    catch (err) {
        console.log('Error in processing Event Notification');
        console.log(err);
    }
}

async function checkDTFrenzyMessage(message) {
    try {
        const channel = message.client.channels.cache.get(message.channelId);
        const frenzyRoleId = "813286043146780742";

        if (!message.content.includes("] Global") || !message.content.includes("Frenzy in the Realm of Dragonrip!"))
            return;

        if (message.client.hasOwnProperty('dtfrenzy') && message.client.dtfrenzy == true)
            return;
        message.client.dtfrenzy = true;

        str = '<@&' + frenzyRoleId + '>' + message.content;
        channel.send(str);
        console.log(str);

        await wait(5 * 60 * 1000);
        message.client.dtfrenzy = false;
    }
    catch (err) {
        console.log('Error in processing DT Frenzy Notification');
        console.log(err);
    }
}

async function checkAuraMessage(message) {
    try {
        const channel = message.client.channels.cache.get(message.channelId);
        const hiroID = "468512328757805059";

        if (!message.content.includes("] Global") || !message.content.includes("Dragon Tokens to Diabolos") || !message.content.includes("of Diabolic Aura."))
            return;

        if (message.client.hasOwnProperty('aura') && message.client.aura == true)
            return;
        message.client.aura = true;

        str = '<@' + hiroID + '>' + message.content;
        channel.send(str);
        console.log(str);

        await wait(5 * 60 * 1000);
        message.client.aura = false;
    }
    catch (err) {
        console.log('Error in processing Aura Notification');
        console.log(err);
    }
}

async function checkTrollMessage(message) {
    try {

        if (!message.content.includes("Global: "))
            return;

        if ((message.content.includes("killed") && message.content.includes("and obtained")) ||
            (message.content.includes("Treasure and obtained")) ||
            (message.content.includes("completed") && message.content.includes("Bounty") && message.content.includes("and obtained"))
        ) {
            const hiroID = "468512328757805059";
            const channel = message.client.channels.cache.get(message.channelId);
            let str = "";
            if (message.content.includes("Hiro")) {
                str = "Congrats," + '<@' + hiroID + '>! ' + "Finally found something on your main account!!?!!";
            }
            else if (message.content.includes("Chronos")) {
                const chronosID = "573415328466599936";
                str = "Congrats," + '<@' + chronosID + '>! ' + "You deserve it more than anyone else here!";
            }
            else {
                str = "Congrats," + '<@' + hiroID + '>! ' + "That's one of your multis, right?";
            }
            channel.send(str);
            console.log(str);
        }
    }
    catch (err) {
        console.log('Error in processing Troll Notification');
        console.log(err);
    }
}

async function checkPingTimer(message) {
    let replies = ['k', 'aight', 'i gotchu', 'sure if i remember', 'maybe later', 'lol gl with that thoughts and prayers'];
    let reply_index = Math.floor(Math.random() * replies.length);

    if (!message.client.hasOwnProperty("planting")) {
        message.client.planting = {};
    }

    try {
        const channel = message.client.channels.cache.get(message.channelId);
        const user = message.author.id;
        let str = "";

        let message_arr = message.content.split('\n');
        let delay = parseTimeString(message_arr);
        if (delay == 0) {
            message.reply('Something went wrong, idk what time to ping you.');
            console.log('Delay of 0 in processing cauldron ping');
            return;
        }

        if (message.content.includes("will be able to drink in:")) {
            if (message_arr.length < 2) return;
            delay += 60 * 1000;
            str = '<@' + user + '>' + ' Your cauldron is ready now.';
        }
        else if (message.content.includes("is still growing!")) {
            if (message_arr.length < 2) return;
            str = '<@' + user + '>' + ' Pick your plants.';

            message.client.planting[user] = true;
            message.reply(replies[reply_index]);

            await wait(delay);
            message.client.planting[user] = false;

            channel.send(str);
            console.log(str);

            await wait(20 * 60 * 1000);
            if (message.client.planting[user] == false) {
                str = '<@' + user + '>' + ' You forgot to ask me to ping for herbalism. Did you forget to replant?';
                channel.send(str);
                console.log(str);
            }
            return;
        }
        else if (message.content.includes("have successfully started to rise") || message.content.includes("are rising from the Dead!")) {
            if (message_arr.length < 2) return;
            str = '<@' + user + '>' + ' Yo dawg, time to check Hades.';
        }
        else if (message.content.includes("Wild Captcha Event in:")) {
            if (message_arr.length < 2) return;
            delay -= (29 * 60 * 1000);
            if (delay <= 0) {
                message.reply('Maybe just do your botcheck now...');
                return;
            }
            str = '<@' + user + '>' + ' Botcheck within half an hour.';
        }
        else if (message.content.includes("Your Pet is Exploring")) {
            str = '<@' + user + '>' + ' Your pet is done exploring.';
        }
        else if (message.content.includes("Your Pet is Training.")) {
            str = '<@' + user + '>' + ' Your pet is done training.';
        }
        else if (message.content.includes("Time left: ")) {
            str = '<@' + user + '>' + ' Why am I pinging you again? Prolly aint important.';
        }

        message.reply(replies[reply_index]);
        await wait(delay);
        channel.send(str);
        console.log(str);
    }
    catch (err) {
        console.log('Error in processing ping timer');
        console.log(err);
        console.log(message);
    }
}

//Returns milliseconds
function parseTimeString(msg_arr) {
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    for (let row = 0; row < msg_arr.length; row++) {
        let arr = msg_arr[row].split(' ');
        try {
            for (let i = 0; i < arr.length; i++) {
                if (arr[i].includes('h.')) {
                    if (arr[i] === 'h.' && i > 0) {
                        hours += parseInt(arr[i - 1]);
                    }
                    else {
                        hours += parseInt(arr[i]);
                    }
                }
                else if (arr[i].includes('min.')) {
                    if (arr[i] === 'min.' && i > 0) {
                        minutes += parseInt(arr[i - 1]);
                    }
                    else {
                        minutes += parseInt(arr[i]);
                    }
                }
                else if (arr[i].includes('s.')) {
                    if (arr[i] === 's.' && i > 0) {
                        seconds += parseInt(arr[i - 1]);
                    }
                    else {
                        seconds += parseInt(arr[i]);
                    }
                }
            }
        }
        catch (err) {
            console.log('Error in parsing time string.');
            console.log(err);
        }
    }

    return ((hours * 60 + minutes) * 60 + seconds) * 1000;
}

module.exports = {
	name: Events.MessageCreate,
    async execute(message) {
        if (!message.client.channel_whitelist.all.includes(message.channelId)) {
            return;
        }
        if (message.author.bot) {
            return;
        }

        if (message.client.channel_whitelist.bounty.includes(message.channelId)) {
            checkBountyMessage(message);
        }

        if (message.client.channel_whitelist.event.includes(message.channelId)) {
            checkHellMessage(message);
            checkEventMessage(message);
            checkDTFrenzyMessage(message);
            checkAuraMessage(message);
            checkTrollMessage(message);
        }

        if (message.client.channel_whitelist.botspam.includes(message.channelId)) {
            checkPingTimer(message);
        }
	},
};