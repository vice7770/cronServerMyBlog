import cron from 'node-cron';
import pkg from 'pg';

// Database connection configuration
const { Client } = pkg;

const client = new Client({
    user: process.env.POSTGRES_URL,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PORT ?? 3000,
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
client.connect();

// async function fetchDataAndSave(res) {
//     console.log('######################################');
//     console.log('# Running scheduler #');
//     console.log('######################################');

//     try {
//         // Fetch data from API
//         const response = await fetch('https://open-weather13.p.rapidapi.com/city/Lisbon/EN', {
//             method: 'GET',
//             headers: {
//                 'x-rapidapi-host': ,
//                 'x-rapidapi-key': 'cd969b94f8msh4723041a9be570cp1f612bjsn282973c1014c'
//             }
//         });
//         if (!response.ok) {
//             throw new Error('Failed to fetch data from API');
//         }
//         const data = await response.json();
//         // Save data to database
//         console.log('Saving data to database...');
//         console.log(data);
//         res.json({ data: 'Success', status: 200 });
//     } catch (apiError) {
//         console.error('Error fetching data from API or saving to database:', apiError);
//     }
// }

export async function GET() {
    try {
        // cron.schedule('*/20 * * * *', async () => {
        //     console.log('')
        //     console.log('######################################')
        //     console.log('#                                    #')
        //     console.log('# Running scheduler every 20 minutes #')
        //     console.log('#                                    #')
        //     console.log('######################################')
        //     console.log('')

        //     // Perform your action here
        // });
        console.log('shecduler process');
        return res.json({ data: 'Success', status: 200 });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: error.message });
    }
}