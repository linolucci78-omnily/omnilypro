package com.omnilypro.pos.mdm;

/**
 * MDM Configuration
 * Contiene le configurazioni per la connessione al backend Supabase
 */
public class MdmConfig {

    // TODO: Sostituisci con le tue credenziali Supabase
    public static final String SUPABASE_URL = "https://your-project.supabase.co";
    public static final String SUPABASE_ANON_KEY = "your-anon-key";

    // Intervalli di polling (millisecondi)
    public static final long HEARTBEAT_INTERVAL_MS = 30000; // 30 secondi
    public static final long COMMAND_POLL_INTERVAL_MS = 60000; // 60 secondi

    // Endpoints API
    public static final String DEVICES_ENDPOINT = "/rest/v1/devices";
    public static final String COMMANDS_ENDPOINT = "/rest/v1/device_commands";
    public static final String LOGS_ENDPOINT = "/rest/v1/mdm_activity_logs";

    // Device status
    public static final String STATUS_ONLINE = "online";
    public static final String STATUS_OFFLINE = "offline";
    public static final String STATUS_MAINTENANCE = "maintenance";

    // Command types
    public static final String CMD_REBOOT = "reboot";
    public static final String CMD_SHUTDOWN = "shutdown";
    public static final String CMD_KIOSK_ON = "kiosk_on";
    public static final String CMD_KIOSK_OFF = "kiosk_off";
    public static final String CMD_UPDATE_APP = "update_app";
    public static final String CMD_SYNC_CONFIG = "sync_config";
    public static final String CMD_LOCATE = "locate";

    // Command status
    public static final String CMD_STATUS_PENDING = "pending";
    public static final String CMD_STATUS_EXECUTING = "executing";
    public static final String CMD_STATUS_COMPLETED = "completed";
    public static final String CMD_STATUS_FAILED = "failed";
}
