const { MongoClient } = require('mongodb');

// Any url to mongodb database
const uri = 'mongodb://127.0.0.1:27016/foo_database';

const reproduce = async () => {
    // Create client and connect
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    // ensure that in collection of choice there are two documents
    const foo = db.collection('foo');
    await foo.deleteMany();
    await foo.insertOne({
        _id: 'another_id',
        valid: true,
    });
    await foo.insertOne({
        _id: 'some_id',
        valid: false,
    });

    // iterate through cursor using map and then resolve to array
    try {
        await foo.find(
            {},
            {
              // sort ascendingly (so first valid document and then invalid one)
              sort: { _id: 1 }
            }
        ).map(doc => {
            // throw on invalid document
            if (!doc.valid) {
                throw new Error('I expect it to be logged, but not thrown into my face');
            }
            return doc;
        }).toArray();
    } catch (err) {
        // we get here as expected
        console.log('And catch works fine', { err: err.message });
    }

    // but if I change the order of sorting (so I start iterating from invalid document)
    try {
        await foo.find(
            {},
            {
              // sort descendingly (so first invalid document and then valid one)
              sort: { _id: -1 }
            }
        ).map(doc => {
            // throw on invalid document
            if (!doc.valid) {
                throw new Error('I expect it to be logged, but not thrown into my face');
            }
            return doc;
        }).toArray();
    } catch (err) {
        // we don't get here - instead we get uncaught exception
        console.log('I will never be called, but I should have been');
    }
}

reproduce()
.then(() => console.log('Reproduction finished'))
.catch(err => console.log('Catcher v2',  { err }));

