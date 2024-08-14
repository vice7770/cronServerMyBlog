
// Define the insert function
const upsertWeatherData = async (pool, data) => {
    const query = `
        INSERT INTO myblog_weather (name, metadata)
        VALUES ($1, $2)
        ON CONFLICT (name)
        DO UPDATE SET metadata = EXCLUDED.metadata;
    `;
    const values = [data.name, data.metadata];

    try {
        await pool.query(query, values);
        console.log(data.name + ' inserted into database!');
    } catch (err) {
        console.error('Error inserting data into database', err);
    }
};

export default upsertWeatherData;