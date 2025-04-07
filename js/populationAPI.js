// Function to fetch population data from World Bank API using ISO3 country code
export async function getCountryPopulation(iso3Code) {
  const url = `https://api.worldbank.org/v2/country/${iso3Code}/indicator/SP.POP.TOTL?format=json`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch data from World Bank API');
    }

    const data = await response.json();

    // Find the most recent year with a non-null population value
    if (data && data[1] && data[1].length > 0) {
      for (let i = 0; i < data[1].length; i++) {
        const entry = data[1][i];
        if (entry.value !== null) {
          // console.log(`Most recent population data: ${entry.date} = ${entry.value}`);
          return entry.value;
        }
      }
      return 'No population data available';
    } else {
      return 'Data not available for this country';
    }
  } catch (error) {
    console.error(error);
    return 'Error retrieving data';
  }
}


  