package live.tsradio.daemon.console.commands

import live.tsradio.daemon.channel.Channel
import live.tsradio.daemon.console.Command
import live.tsradio.daemon.console.CommandHandler
import live.tsradio.daemon.channel.ChannelHandler
import live.tsradio.daemon.console.CMDInputFinder
import live.tsradio.daemon.files.Filesystem
import org.slf4j.Logger
import org.slf4j.LoggerFactory

class CmdChannel: Command("channel", "<help|list|create|delete|edit|start|restart|stop>", "Manage channels") {
    private val logger: Logger = LoggerFactory.getLogger(CommandHandler::class.java)

    override fun execute(name: String, args: ArrayList<String>) {
        if(args.size < 1){
            sendUsage()
            return
        }

        if(args[0].equals("help", true)) {
            logger.info("Attribute help: ")
            logger.info("[-n] Name of the channel")
            logger.info("[-d] Description of the channel")
            logger.info("[-m] Mount of the channel")
            logger.info("[-s | -!s] Activate shuffle")
            logger.info("[-l | -!l] Activate loop")
            logger.info("[-pl] Bind a playlistUUID")
            logger.info("[-r] Restart/Start after edited/created")
            return
        }

        if(args[0].equals("create",true)) {
            val inputFinder = CMDInputFinder(args)

            val channelName = inputFinder.findValue("n") ?: "unknown"
            val description = inputFinder.findTillNext("d") ?: "No description"
            val mount = inputFinder.findValue("m")
            val playlistID = inputFinder.findValue("pl") ?: ""
            val creator = inputFinder.findTillNext("c") ?: "SYSTEM"
            val shuffle = !inputFinder.findExists("s") || !inputFinder.findExists("!s")
            val loop = !inputFinder.findExists("l") || !inputFinder.findExists("!l")

            if(mount.isNullOrEmpty()) {
                logger.warn("Mountpoint required in order to create channel.")
                return
            }

            val channel = Channel(Filesystem.preferences.node.nodeID, channelName, description, creator, mount, playlistID, shuffle, loop, ArrayList())
            if(ChannelHandler.channelExistsByName(channelName)){
                logger.warn("Channel '${channel.channelName}' already exists.")
                return
            }

            if(ChannelHandler.channelExistsByMount(mount)) {
                logger.warn("Channel with mount '$mount' already exists.")
                return
            }

            ChannelHandler.createChannel(channel)
            return
        }

        if(args[0].equals("delete",true)) {
            if(args.size < 1) {
                sendText("Syntax: $name ${args[0].toLowerCase()} <channel_name>")
                return
            }

            val channelName = args[1]

            if(!ChannelHandler.channelExistsByName(channelName)) {
                logger.warn("Channel '$channelName' does not exist.")
                return
            }

            ChannelHandler.deleteChannel(ChannelHandler.getChannelByName(channelName))
            return
        }

        if(args[0].equals("edit",true)) {
            if(args.size < 2) {
                sendText("Syntax: $name ${args[0].toLowerCase()} <channel_name> [params: See 'channel help']")
                return
            }
            var channelName = args[1]

            if(!ChannelHandler.channelExistsByName(channelName)) {
                logger.warn("Channel '$channelName' does not exist.")
                return
            }

            val channel = ChannelHandler.getChannelByName(channelName)

            val inputFinder = CMDInputFinder(args)
            channelName = inputFinder.findValue("n") ?: channel.channelName
            val description = inputFinder.findTillNext("d") ?: channel.description
            val mount = inputFinder.findValue("m") ?: channel.mountpoint
            val playlistID = inputFinder.findValue("pl") ?: channel.playlistID
            val creator = inputFinder.findTillNext("c") ?: channel.creator
            val shuffle = !inputFinder.findExists("s") || !inputFinder.findExists("!s")
            val loop = !inputFinder.findExists("l") || !inputFinder.findExists("!l")

            channel.channelName = channelName
            channel.description = description
            channel.mountpoint = mount
            channel.playlistID = playlistID
            channel.creator = creator
            channel.shuffle = shuffle
            channel.loop = loop

            ChannelHandler.editChannel(channelName, channel)
            return
        }

        /*if(args[0].equals("list",true)) {
            logger.info("[]========= Active Channels =========[]")

            if(ChannelHandler.activeChannels.isEmpty()){
                logger.info("No channels currently running or nothing found.")
            } else {
                for(channel in ChannelHandler.activeChannels.values){
                    logger.info(">> [${channel.id}]: ${channel.name} - ${channel.description} ")
                }
            }

            logger.info(" ")
            logger.info("[]========= Inactive Channels =========[]")

            if(FileSystem.channels.isEmpty()){
                logger.info("No channels currently inactive or nothing found.")
            } else {
                for(channel in FileSystem.channels.values){
                    if(!ChannelHandler.activeChannels.containsKey(channel.name)) {
                        logger.info(">> ${channel.name} - ${channel.description} ")
                    }
                }
            }

            logger.info(" ")
            logger.info("[]========= Remotely configured ========[]")
            for(doc in Firestore.getAllChannels().get().documents) {
                val json = FileSystem.gson.toJson(doc.data)
                val channel = FileSystem.gson.fromJson(json, JsonChannel::class.java).toChannel()
                if(!FileSystem.channels.containsKey(channel.name)) {
                    logger.info(">> ${channel.name} - ${channel.description} - NodeID: ${channel.nodeID} (${when (channel.nodeID == FileSystem.config.node.nodeID) {
                            true -> "this"
                            else -> "other"
                        }
                    })")
                }
            }
            return
        }*/

        /*if(args[0].equals("start",true)) {
            if(args.size != 2) {
                sendText("Syntax: $name ${args[0].toLowerCase()} <channel_name>")
                return
            }
            ChannelHandler.startChannel(args[1])
            return
        }

        if(args[0].equals("restart",true)) {
            if(args.size != 2) {
                sendText("Syntax: $name ${args[0].toLowerCase()} <channel_name>")
                return
            }
            ChannelHandler.restartChannel(args[1])
            return
        }
        if(args[0].equals("stop",true)) {
            if(args.size != 2) {
                sendText("Syntax: $name ${args[0].toLowerCase()} <channel_name>")
                return
            }
            ChannelHandler.stopChannel(args[1])
            return
        }*/

        logger.warn("Could not handle argument '${args[0]}'")
    }
}