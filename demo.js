const { MongoClient, ClientSession } = require('mongodb')

async function main() {
    
    const uri = "mongodb+srv://player1:root@media-server.n9lrn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
    
    const client = new MongoClient(uri)

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