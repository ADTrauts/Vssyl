#!/bin/bash

# Build Configuration Management Script
# Helps manage different Cloud Build configurations

set -e

CONFIG_DIR="cloudbuild-archive"
CURRENT_CONFIG="cloudbuild.yaml"

show_help() {
    echo "🔧 Cloud Build Configuration Manager"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  list          List available configurations"
    echo "  status        Show current configuration status"
    echo "  switch <name> Switch to a different configuration"
    echo "  backup        Create backup of current configuration"
    echo "  restore <name> Restore from backup"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 status"
    echo "  $0 switch original"
    echo "  $0 backup"
    echo "  $0 restore original"
}

list_configs() {
    echo "📋 Available Build Configurations:"
    echo ""
    
    # Current config
    if [ -f "$CURRENT_CONFIG" ]; then
        echo "✅ CURRENT: $CURRENT_CONFIG"
        echo "   $(wc -l < $CURRENT_CONFIG) lines"
        echo ""
    fi
    
    # Archived configs
    if [ -d "$CONFIG_DIR" ]; then
        echo "📁 Archived Configurations:"
        for file in "$CONFIG_DIR"/*.yaml; do
            if [ -f "$file" ]; then
                basename_file=$(basename "$file")
                echo "   📄 $basename_file ($(wc -l < "$file") lines)"
            fi
        done
    fi
}

show_status() {
    echo "🔍 Current Build Configuration Status:"
    echo ""
    
    if [ -f "$CURRENT_CONFIG" ]; then
        echo "✅ Active Config: $CURRENT_CONFIG"
        echo "📏 Size: $(wc -l < $CURRENT_CONFIG) lines"
        echo "📅 Modified: $(stat -f "%Sm" "$CURRENT_CONFIG")"
        echo ""
        
        # Check for optimization features
        if grep -q "cache-from" "$CURRENT_CONFIG"; then
            echo "🚀 Features: Docker layer caching enabled"
        fi
        
        if grep -q "waitFor" "$CURRENT_CONFIG"; then
            echo "⚡ Features: Parallel builds enabled"
        fi
        
        if grep -q "gsutil" "$CURRENT_CONFIG"; then
            echo "💾 Features: Dependency caching enabled"
        fi
        
    else
        echo "❌ No active configuration found!"
    fi
}

switch_config() {
    local config_name="$1"
    
    if [ -z "$config_name" ]; then
        echo "❌ Error: Please specify a configuration name"
        echo "Available configs:"
        list_configs
        exit 1
    fi
    
    local config_file="$CONFIG_DIR/$config_name.yaml"
    
    if [ ! -f "$config_file" ]; then
        echo "❌ Error: Configuration '$config_name' not found"
        echo "Available configs:"
        list_configs
        exit 1
    fi
    
    # Backup current config
    if [ -f "$CURRENT_CONFIG" ]; then
        cp "$CURRENT_CONFIG" "$CONFIG_DIR/backup-$(date +%Y%m%d-%H%M%S).yaml"
        echo "💾 Backed up current config"
    fi
    
    # Switch to new config
    cp "$config_file" "$CURRENT_CONFIG"
    echo "✅ Switched to configuration: $config_name"
    echo "📋 New config: $(wc -l < $CURRENT_CONFIG) lines"
}

backup_config() {
    local backup_name="backup-$(date +%Y%m%d-%H%M%S)"
    
    if [ -f "$CURRENT_CONFIG" ]; then
        cp "$CURRENT_CONFIG" "$CONFIG_DIR/$backup_name.yaml"
        echo "✅ Created backup: $backup_name.yaml"
    else
        echo "❌ No current configuration to backup"
        exit 1
    fi
}

restore_config() {
    local config_name="$1"
    
    if [ -z "$config_name" ]; then
        echo "❌ Error: Please specify a configuration name to restore"
        echo "Available configs:"
        list_configs
        exit 1
    fi
    
    local config_file="$CONFIG_DIR/$config_name.yaml"
    
    if [ ! -f "$config_file" ]; then
        echo "❌ Error: Configuration '$config_name' not found"
        echo "Available configs:"
        list_configs
        exit 1
    fi
    
    # Backup current config
    if [ -f "$CURRENT_CONFIG" ]; then
        cp "$CURRENT_CONFIG" "$CONFIG_DIR/backup-$(date +%Y%m%d-%H%M%S).yaml"
        echo "💾 Backed up current config"
    fi
    
    # Restore config
    cp "$config_file" "$CURRENT_CONFIG"
    echo "✅ Restored configuration: $config_name"
}

# Main command handling
case "${1:-help}" in
    "list")
        list_configs
        ;;
    "status")
        show_status
        ;;
    "switch")
        switch_config "$2"
        ;;
    "backup")
        backup_config
        ;;
    "restore")
        restore_config "$2"
        ;;
    "help"|*)
        show_help
        ;;
esac
