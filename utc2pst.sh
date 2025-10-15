#!/bin/zsh

# Function to convert UTC to PST/PDT
function utc2pst() {
    if [ -z "$1" ]; then
        echo "Usage: utc2pst '2025-06-13T12:30:00Z'"
        return 1
    fi

    # Debug output
    echo "Input: $1"
    
    # Convert UTC to Pacific time using macOS date command
    # Using a simpler approach with -u flag to handle UTC input
    TZ='America/Los_Angeles' date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$1" "+%Y-%m-%d %I:%M:%S %p %Z"
}

# Make the function available in the current shell
autoload -Uz utc2pst 