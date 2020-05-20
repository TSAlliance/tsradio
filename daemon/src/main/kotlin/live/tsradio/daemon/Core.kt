package live.tsradio.daemon

import live.tsradio.daemon.channel.ChannelHandler
import live.tsradio.daemon.console.CommandHandler
import live.tsradio.daemon.console.ConsoleHandler
import live.tsradio.daemon.exception.ExceptionHandler
import live.tsradio.daemon.files.Filesystem
import org.slf4j.Logger
import org.slf4j.LoggerFactory

fun main() {
    Core()
}

class Core {
    companion object {
        private val logger: Logger = LoggerFactory.getLogger(Core::class.java)
    }

    init {
        try {
            logger.info("Starting daemon...")

            // Init handlers
            Filesystem
            CommandHandler
            ConsoleHandler().start()

            // Autostart channels
            for(channel in ChannelHandler.configuredChannels.values){

            }

            Thread.currentThread().join()
            logger.info("Daemon shut down.")
        } catch (ex: Exception){
            ExceptionHandler(ex).handle()
        } catch (ex: ExceptionInInitializerError) {
            ExceptionHandler(ex.exception).handle()
        }
    }
}