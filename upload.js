const express = require("express");
const app = express();
const fs = require("fs");
const mongodb = require('mongodb');
const { MongoClient, ClientSession } = require('mongodb')

const dotenv = require('dotenv')

dotenv.config()


const uri = process.env.URI
  
const client = new MongoClient(uri)

async function main() {
    
  try {
      await client.connect()
      await listDatabases(client)
  } catch (e) {
      console.error(e)
  } finally {
      await client.close()
      console.log(`Connected to MongoDB`)
  }
}

main().catch(console.error)

async function listDatabases(client) {
  const databasesList = await client.db().admin().listDatabases()

  console.log(`Databases:`)
  databasesList.databases.forEach(db => {
      console.log(`-- ${db.name}`)
  })
}

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
  console.log(`GET / route works`)
});

// Sorry about this monstrosity
app.get('/init-video', async function (req, res) {
  mongodb.MongoClient.connect(uri, function (error, client) {
    if (error) {
      res.status(500).json(error);
      return;
    }

  
    const db = client.db('myFirstDatabase');
    console.log(`client.db(myFirstDatabase) instantiated`)
    const bucket = new mongodb.GridFSBucket(db);
    console.log(`new mongodb.GridFSBucket(db) instantiated`)
    const videoUploadStream = bucket.openUploadStream('dui_lol');
    console.log(`videoUploadStream instantiated`)
    const videoReadStream = fs.createReadStream('./dui_lol.mp4');
    console.log(`videoReadStream instantiated`)
    videoReadStream.pipe(videoUploadStream);
    console.log(`videoReadStream.pipe instantiated`)
    res.status(200).send("Done...");
    console.log(`GET /init-video route works`)
    })
  })





app.get("/mongo-video", function (req, res) {
  console.log(`GET /mongo-video route launched`)
  mongodb.MongoClient.connect(uri, function (error, client) {
    if (error) {
      res.status(500).json(error);
      return;
    }

    const range = req.headers.range;
    if (!range) {
      res.status(400).send("Requires Range header");
    }

    const db = client.db('videos');
    // GridFS Collection
    db.collection('fs.files').findOne({}, (err, video) => {
      if (!video) {
        res.status(404).send("No video uploaded!");
        return;
      }

      // Create response headers
      const videoSize = video.length;
      const start = Number(range.replace(/\D/g, ""));
      const end = videoSize - 1;

      const contentLength = end - start + 1;
      const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
      };

      // HTTP Status 206 for Partial Content
      res.writeHead(206, headers);

      const bucket = new mongodb.GridFSBucket(db);
      const downloadStream = bucket.openDownloadStreamByName('dui_lol', {
        start
      });

      // Finally pipe video to response
      downloadStream.pipe(res);
      console.log(`GET /mongo-video route works`)
    });
  });
});

app.listen(8000, function () {
  console.log("Listening on port 8000!");
});