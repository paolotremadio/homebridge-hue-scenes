
# Philips Hue Scenes

## Why this plugin

- Easily describe scenes in JSON format.
- Use scenes to manipulate every property supported by the Hue REST API.
- Alias lights by nicknames, so you can replace a bulb on your Hub without having to change all the scenes.
- Support for groups of lights, so you can reduce the copy&paste if you want to apply the same settings to multiple lights.
- Pick a random scene.
- Easily backup your scenes (they are on file, in JSON).
- Easily share your scenes (they are on file, in JSON).
- Go over the `100 scenes` limit set by HomeKit. You can have as many scenes as you like. 

## Config 
  
Example config.json:  
  
```json
{
  "accessory": "HueScenes",
  "name": "Living room",
  "bridge": {
    "host": "192.168.1.10",
    "username": "ABCDEFC872NAD&"
  },
  "scenesFile": "livingRoomRandomScenes.json"
}
```

This accessory will create a Switch for every scene. Turning on a switch will apply the Scene. There's also a Switch to pick a random scene.

## Configuration options  
  
| Attribute | Required | Usage | Example |
|-----------|----------|-------|---------|
| name | Yes | A unique name for the accessory. It will be used as the accessory name in HomeKit. | `Living Room Scenes` |
| bridge | Yes | IP and Username for your Philips Hue Hub | n/a |
| sceneFiles | Yes | A file describing your scenes | n/a |

## Scenes file
See [example.json](example.json)
