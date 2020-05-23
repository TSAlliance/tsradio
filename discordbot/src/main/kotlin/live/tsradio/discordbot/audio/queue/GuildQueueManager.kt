package live.tsradio.discord.audio.queue

import com.sedmelluq.discord.lavaplayer.player.AudioLoadResultHandler
import com.sedmelluq.discord.lavaplayer.player.AudioPlayer
import com.sedmelluq.discord.lavaplayer.player.event.AudioEventAdapter
import com.sedmelluq.discord.lavaplayer.source.AudioSourceManagers
import com.sedmelluq.discord.lavaplayer.tools.FriendlyException
import com.sedmelluq.discord.lavaplayer.track.AudioPlaylist
import com.sedmelluq.discord.lavaplayer.track.AudioTrack
import live.tsradio.discord.audio.AudioProvider
import live.tsradio.discord.audio.VoiceHandler
import live.tsradio.discordbot.language.Lang
import live.tsradio.discordbot.message.Messages
import discord4j.core.`object`.entity.Guild
import discord4j.core.`object`.entity.Message
import reactor.core.publisher.Mono
import java.util.concurrent.BlockingQueue
import java.util.concurrent.LinkedBlockingQueue

class GuildQueueManager(val guild: Guild, val audioPlayer: AudioPlayer): AudioEventAdapter(), AudioLoadResultHandler {

    val audioProvider: discord4j.voice.AudioProvider = AudioProvider(audioPlayer)
    var queue: BlockingQueue<AudioTrack> = LinkedBlockingQueue()
    var lastInfoMessage: Message? = null
    var shuffle: Boolean = false
    var loop: Boolean = false

    init {
        AudioSourceManagers.registerRemoteSources(VoiceHandler.playerManager)
        audioPlayer.addListener(this)
    }

    /*private fun enqueue(track: AudioTrack): Mono<Void> {
        return Mono.create {
            if (!audioPlayer.startTrack(track, true)) {
                queue.offer(track)
                sendEnqueuedInfo(track)
                it.success()
            }
        }
    }

    private fun enqueuePlaylist(list: AudioPlaylist) {
        list.tracks.forEach { track -> run {
            queue.offer(track)
        }}.also {
            sendEnqueuedListInfo(list.tracks.size)
        }

        if(audioPlayer.playingTrack == null) {
            next()
        }
    }

    fun next(){
        if(queue.isNotEmpty()) {
            if(shuffle) {
                audioPlayer.startTrack(queue.random(), false)
            } else {
                audioPlayer.startTrack(queue.take(), false)
            }
        } else {
            audioPlayer.stopTrack()
        }
    }

    fun skip(amount: Int): Mono<Void> {
        return Mono.create {
            val count = when {
                queue.size <= amount -> queue.size
                else -> amount
            }

            if(count > 1) {
                queue = LinkedBlockingQueue(queue.filterIndexed { index, _ -> index+1 !in 0..amount })
            }

            next()
            Messages.sendText(Lang.getString("audio_skipped"), VoiceHandler.getTextChannel(guild)!!).subscribe()
            it.success()
        }
    }*/

    fun stop(): Mono<Void> {
        return Mono.create {
            queue.clear()
            audioPlayer.stopTrack()
            it.success()
        }
    }

    override fun onTrackStart(player: AudioPlayer?, track: AudioTrack?) {
        sendInfoMessage(track!!)
    }

    override fun onPlayerPause(player: AudioPlayer?) {
        Messages.sendText(Lang.getString("audio_paused"), VoiceHandler.getTextChannel(guild)!!).subscribe()
    }

    override fun onPlayerResume(player: AudioPlayer?) {
        Messages.sendText(Lang.getString("audio_resumed"), VoiceHandler.getTextChannel(guild)!!).subscribe()
    }

    override fun loadFailed(exception: FriendlyException?) {
        if (exception != null) {
            Messages.sendException(exception, VoiceHandler.getTextChannel(guild)!!).subscribe()
        }
    }

    override fun trackLoaded(track: AudioTrack?) {
        VoiceHandler.getQueueManager(guild)!!.audioPlayer.startTrack(track, false)
    }

    override fun noMatches() {
        Messages.sendError(Lang.getString("error_404"), VoiceHandler.getTextChannel(guild)!!).subscribe()
    }

    override fun playlistLoaded(playlist: AudioPlaylist?) {}

    private fun sendInfoMessage(track: AudioTrack){
        if(!track.info.isStream) {

            if(lastInfoMessage != null) {
                lastInfoMessage!!.delete().subscribe()
            }

            var millis = track.duration
            var hours = 0
            var min = 0
            var sec = 0

            while(millis >= 1000){
                ++sec
                millis -= 1000
            }
            while(sec >= 60){
                ++min
                sec -= 60
            }
            while(min >= 60){
                ++hours
                min -= 60
            }

            var h: String = hours.toString()
            var m: String = min.toString()
            var s: String = sec.toString()

            if(h.length <= 1) h = "0$h"
            if(m.length <= 1) m = "0$m"
            if(s.length <= 1) s = "0$s"

            val d: String = when (hours) {
                0 -> "${m}:${s}"
                else -> "${h}:${m}:${s}"
            }

            val looped: Boolean = VoiceHandler.getQueueManager(guild)!!.loop
            val shuffled: Boolean = VoiceHandler.getQueueManager(guild)!!.shuffle

            VoiceHandler.getTextChannel(guild)!!.createMessage { message -> run {
                message.setContent("**${Lang.getString("audio_now_playing")}**")
                message.setEmbed { embed -> run {
                    embed.setTitle(track.info.title)
                    embed.setDescription(" ")
                    embed.addField(Lang.getString("audio_channel"), track.info.author, false)
                    embed.addField(Lang.getString("audio_duration"), d, false)

                    if(looped || shuffled) {
                        embed.addField(
                            Lang.getString("audio_settings"), when(looped){
                            true -> Lang.getString("info_looped")+" "
                            else -> ""
                        } + when(shuffled){
                            true -> Lang.getString("info_shuffle")
                            else -> ""
                        }, false)
                    }

                    embed.setUrl(track.info.uri)
                }}
            }}.subscribe { lastInfoMessage = it }
        }
    }

}