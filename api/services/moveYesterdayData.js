async function moveYesterdayData(pool, data){
    const query = `    
        INSERT INTO myblog_weatherPreviousDay
        SELECT * FROM myblog_weather`;

    try {
        await pool.query(query);
        console.log(data.name + ' inserted into database!');
    } catch (err) {
        console.error('Error inserting data into database', err);
    }
}
export default moveYesterdayData;