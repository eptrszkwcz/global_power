// Function to fetch population data from World Bank API using ISO3 country code
export async function getCountryPopulation(iso3Code) {
    const url = `https://api.worldbank.org/v2/country/${iso3Code}/indicator/SP.POP.TOTL?format=json`;
  
    try {
      // Fetch data from World Bank API
      const response = await fetch(url);
      
      // Check if the response is successful
      if (!response.ok) {
        throw new Error('Failed to fetch data from World Bank API');
      }
  
      // Parse the JSON response
      const data = await response.json();
  
      // Check if the data is available and return the population
      if (data && data[1] && data[1].length > 0) {
        const population = data[1][0].value;
        return population !== null ? population : 'Data not available';
      } else {
        return 'Data not available for this country';
      }
    } catch (error) {
      console.error(error);
      return 'Error retrieving data';
    }
  }

  