package {{PACKAGE}};

import org.bukkit.plugin.java.JavaPlugin;

public class {{CLASS_NAME}} extends JavaPlugin {

    @Override
    public void onEnable() {
        // Plugin startup logic
        getLogger().info("{{CLASS_NAME}} has been enabled!");
    }

    @Override
    public void onDisable() {
        // Plugin shutdown logic
        getLogger().info("{{CLASS_NAME}} ha been disabled!");
    }
}