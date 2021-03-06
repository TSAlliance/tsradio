package live.tsradio.streamer.database;

import live.tsradio.streamer.files.FileHandler;
import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.ArrayList;

public class MySQL {
    private static final Logger logger = LoggerFactory.getLogger(MySQL.class);

    public static final String PREFIX = (String) ((JSONObject) FileHandler.getInstance().getConfig().get("mysql")).get("prefix");
    public static final String TABLE_CHANNELS = "channels";
    public static final String TABLE_PLAYISTS = "playlists_info";

    private static MySQL instance;
    private static Connection connection;

    public MySQL() {
        this.connect();
    }

    private void connect() {
        try {
            logger.info("connect(): Connecting to mysql database...");

            JSONObject mysqlConfig = (JSONObject) FileHandler.getInstance().getConfig().get("mysql");
            String host = (String) mysqlConfig.get("host");
            long port = (long) mysqlConfig.get("port");
            String database = (String) mysqlConfig.get("database");
            String user = (String) mysqlConfig.get("user");
            String password = (String) mysqlConfig.get("pass");

            connection = DriverManager.getConnection("jdbc:mysql://"+host+":"+port+"/"+database+"?autoReconnect=true", user, password);
            logger.info("MySQL(): Connected to mysql database '"+user+"'@'"+host+":"+port+"'");
        } catch (Exception ex) {
            if(ex instanceof SQLNonTransientConnectionException) {
                logger.error("MySQL(): "+ex.getMessage());
            } else {
                ex.printStackTrace();
            }
        }
    }

    private boolean hasConnection() {
        try {
            return connection != null && !connection.isClosed();
        } catch (SQLException throwable) {
            throwable.printStackTrace();
            return false;
        }
    }

    public ResultSet query(String query) {
        if(!hasConnection()) return null;

        try {
            PreparedStatement pps = connection.prepareStatement(query);

            ResultSet rs = pps.executeQuery();
            if(rs.next()) {
                return rs;
            } else {
                return null;
            }
        } catch (SQLException throwable) {
            throwable.printStackTrace();
            return null;
        }
    }

    public ResultSet get(String tableName, String where, ArrayList<String> attributes){
        String attrs = attributes.isEmpty() ? "*" : String.join(",",attributes);
        String whereClause = where != null ? "WHERE "+where : "";

        return this.query("SELECT "+attrs+" FROM `"+PREFIX+tableName+"` "+whereClause+";");
    }

    public static MySQL getInstance() {
        if(instance == null) instance = new MySQL();
        return instance;
    }
}
