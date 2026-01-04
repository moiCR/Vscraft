package {{PACKAGE}}

import org.bukkit.plugin.java.JavaPlugin

class {{CLASS_NAME}} : JavaPlugin() {

    override fun onEnable() {
        // Plugin startup logic
        logger.info("{{CLASS_NAME}} has been enabled!")
    }

    override fun onDisable() {
        // Plugin shutdown logic
        logger.info("{{CLASS_NAME}} ha been disabled!")
    }
    
}