### notes:

# in package.json this is required:

Format:
 ```
   "build": {
    "productName": "helloworld",
    "publish": [
      {
        "provider": "github",
        "owner": "jpobzy",
        "repo": "EVupdateTest"
      }
    ],
    "files": [
      "out/**/*"
    ],
    "nsis": { 
      "artifactName": "${productName}-${version}.${ext}"
    }
  },
  ```

- `"productName": "helloworld",` - helloworld will be the start of the url line in latest.yaml
- the nsis line will remove "-startup-" from the url line



### upload instructions
- to update you need to run npm run build:win
- go to the github repo and create a new release
- attach the latest.yaml and exe (NOT .blockmap) files

### other
- check src/main/index.js for the main code to update it
- in production and console.log commands will not run, its best if you log it. if using `npm install electron-log` log file will be found in `AppData\Roaming\appname`