package live.tsradio.daemon.console.commands

import live.tsradio.daemon.console.Command
import live.tsradio.daemon.console.CommandHandler
import org.slf4j.Logger
import org.slf4j.LoggerFactory

class CmdHelp: Command("help", "", "Get info about available commands") {
    private val logger: Logger = LoggerFactory.getLogger(CommandHandler::class.java)

    override fun execute(name: String, args: ArrayList<String>) {
        logger.info("[]========= Help =========[]")
        for(command in CommandHandler.commands.values){
            logger.info(">> ${command.name} ${command.usage} - ${command.description}")
        }
        logger.info("[]========================[]")
    }
}