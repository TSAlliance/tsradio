package live.tsradio.streamer.objects;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;

public class ChannelInfo {

    @Getter @Setter private String title;
    @Getter @Setter private String artist;
    @Getter @Setter private ArrayList<AudioTrack> history;

    public ChannelInfo() {
        this.clear();
    }

    public void clear() {
        this.title = "null";
        this.artist = "null";
        this.history = new ArrayList<>();
    }
}
