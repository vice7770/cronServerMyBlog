const initializeDb = async (pool) => {
    pool.on('connect', () => {
        console.log('Connected to PostgreSQL');
    });

    pool.on('error', (err) => {
        console.error('Error connecting to PostgreSQL', err);
    });
    
    return pool;
};
// Define the upsert function
// export const upsertWeatherData = async (data) => {
//     const query = `
//         INSERT INTO weather (name, metadata)
//         VALUES ($1, $2, $3)
//         ON CONFLICT (name)
//         DO UPDATE SET metada = EXCLUDED.metadata;
//     `;
//     const values = [data.name, data];

//     try {
//         await pool.query(query, values);
//         console.log('Data upserted to database:', data);
//     } catch (err) {
//         console.error('Error upserting data to database', err);
//     }
// };


export default initializeDb;