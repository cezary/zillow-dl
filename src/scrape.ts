import * as cheerio from 'cheerio';
import fs from 'fs';

import { download } from './download';

export async function scrape(url: string) {
  console.log('scrape', url);
  const html = await fetch(url, {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9,de;q=0.8",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "Referer": url,
      "Referrer-Policy": "unsafe-url",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
    },
    "method": "GET"
  }).then(res => res.text());

  const $ = cheerio.load(html);

  const description = $('meta[property="og:description"]').attr('content');

  // find data
  const __NEXT_DATA__ = $('#__NEXT_DATA__').text();
  const hdpApolloPreloadedData = $('#hdpApolloPreloadedData').text();

  let property;

  // find property data
  if (__NEXT_DATA__) {
    const nextData = JSON.parse(__NEXT_DATA__);
    const gdpClientCache = JSON.parse(nextData.props.pageProps.componentProps.gdpClientCache) as Array<any>;
    property = Object.values(gdpClientCache)[0].property;
  } else if (hdpApolloPreloadedData) {
    const apiCache = JSON.parse(JSON.parse(hdpApolloPreloadedData).apiCache) as Array<any>;
    property = Object.values(apiCache).find(a => a.property?.photos).property
  }

  if (!property) throw new Error('could not find property data');

  const images = property.originalPhotos
    .map((photo: any) => photo.mixedSources.jpeg
      .reduce((acc: { url: string, width: number }, val: { url: string, width: number }) => {
        if (acc?.width > val.width) return acc;
        return val;
      }).url
    );

  let result;

  const address = `${property.address.streetAddress}, ${property.address.city}, ${property.address.state} ${property.address.zipcode}`;

  await fs.promises.mkdir(address);
  await fs.promises.writeFile(`${address}/property.json`, JSON.stringify(property, null, 2));
  await fs.promises.writeFile(`${address}/description.md`, JSON.stringify(description, null, 2));

  for (let i = 0; i < images.length; i++) {
    result = await download(images[i], `${address}/image-${i}.png`);

    if (result === true) {
      console.log('Success:', images[i], 'has been downloaded successfully.');
    } else {
      console.log('Error:', images[i], 'was not downloaded.');
      console.error(result);
    }
  }

  return property;
}
