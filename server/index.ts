import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config';

const app = new Hono();

// Enable CORS
app.use('/*', cors());

// MongoDB Connection
const uri = process.env.MONGODB_URI || "";
if (!uri) {
    console.error("MONGODB_URI environment variable is not defined");
    process.exit(1);
}
const client = new MongoClient(uri);
let collection: any;

async function connectDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db("foodnearby");
        collection = db.collection("events");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}

connectDB();

// Routes

// Get all events
app.get('/api/events', async (c) => {
    try {
        const events = await collection.find({}).sort({ created_at: -1 }).toArray();
        // Transform _id to id for frontend compatibility
        const mappedEvents = events.map((e: any) => ({ ...e, id: e._id.toString() }));
        return c.json({ data: mappedEvents, error: null });
    } catch (err: any) {
        return c.json({ data: null, error: err.message }, 500);
    }
});

// Add event
app.post('/api/events', async (c) => {
    try {
        const body = await c.req.json();
        const newEvent = {
            ...body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        // Remove id if present to let Mongo generate _id
        delete newEvent.id;

        const result = await collection.insertOne(newEvent);
        const addedEvent = { ...newEvent, id: result.insertedId.toString() };

        return c.json({ data: addedEvent, error: null });
    } catch (err: any) {
        return c.json({ data: null, error: err.message }, 500);
    }
});

// Update event
app.patch('/api/events/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const updates = await c.req.json();
        delete updates.id; // Don't update id
        delete updates._id;

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updates },
            { returnDocument: 'after' }
        );

        if (!result) {
            return c.json({ data: null, error: 'Event not found' }, 404);
        }

        const updatedEvent = { ...result, id: result._id.toString() };
        return c.json({ data: updatedEvent, error: null });
    } catch (err: any) {
        return c.json({ data: null, error: err.message }, 500);
    }
});

// Delete event
app.delete('/api/events/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return c.json({ error: 'Event not found' }, 404);
        }

        return c.json({ error: null });
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});

// Delete past events
app.delete('/api/events/cleanup/past', async (c) => {
    try {
        const allEvents = await collection.find({}).toArray();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const idsToDelete: ObjectId[] = [];

        for (const event of allEvents) {
            let timeString = '';
            if (event.date && event.time) {
                timeString = `${event.date}, ${event.time}`;
            } else if (event.date) {
                timeString = event.date;
            }

            if (timeString) {
                const eventDate = new Date(timeString);
                if (!isNaN(eventDate.getTime()) && eventDate < today) {
                    idsToDelete.push(event._id);
                }
            }
        }

        if (idsToDelete.length > 0) {
            await collection.deleteMany({ _id: { $in: idsToDelete } });
        }

        return c.json({ deletedCount: idsToDelete.length, error: null });
    } catch (err: any) {
        return c.json({ deletedCount: 0, error: err.message }, 500);
    }
});


const port = 4000;
console.log(`Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port
});
