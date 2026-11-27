fx_version 'cerulean'
game 'gta5'

author 'matsn0w'
description 'Server-Sided Emergency Lighting System for FiveM.'
version '3.0.0-rc.1'

dependencies {
    'baseevents',
    'warmenu'
}

ui_page 'html/index.html'

files {
    'html/**.*'
}

shared_scripts {
    'config.lua',
    'shared/*.lua'
}

client_script '@warmenu/warmenu.lua'

client_scripts {
    'client/*.lua'
}

server_scripts {
    'lib/*.lua',
    'server/*.lua'
}
