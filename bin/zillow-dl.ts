#!/usr/bin/env bun

import { scrape } from '../src/scrape';

const url = process.argv[2];

scrape(url)
  .then(r => console.log(`finished scraping ${r.streetAddress}`))
  .catch(e => console.error('something went wrong', e));