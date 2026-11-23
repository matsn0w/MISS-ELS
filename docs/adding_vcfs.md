# Adding VCF files

In order to 'install' a new VCF for a vehicle, you have to perform some steps. Don't worry, you'll get it once you've done it a couple of times!

1. Make sure the vehicle has some extras to work with
2. Create a new VCF, either by using [the Configurator](https://matsn0w.github.io/MISS-ELS/configurator) or by writing it yourself
3. Save the file in `.../your resource/xmlFiles/`, make sure it is an `.xml` file
4. Restart the MISS ELS resource if it was currently running

That's it!

**Note: the script will automatically scan the `xmlFiles/` directory for VCF files. This should work on both Windows and Linux-based hosts.**

Some hosting providers don't allow resources to list files. If the server console says it couldn't scan the `xmlFiles` folder, list your VCFs in `config.lua` instead:

```lua
Config.VCFFiles = {
    'police.xml',
    'ambulance.xml',
}
```

Please [report an issue](https://github.com/matsn0w/MISS-ELS/issues) if loading your VCFs still doesn't work.
