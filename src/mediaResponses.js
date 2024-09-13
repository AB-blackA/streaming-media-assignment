const fs = require('fs'); // pull in the file system module
const path = require('path');

const getRangePositions = (requestHeaders) => {
  let { range } = requestHeaders;

  if (!range) {
    range = 'bytes=0-';
  }

  return range.replace(/bytes=/, '').split('-');
};

const calculateRangeValues = (positions, stats) => {
  const total = stats.size;
  let start = parseInt(positions[0], 10);
  const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

  if (start > end) {
    start = end - 1;
  }

  const chunksize = (end - start) + 1;

  return {
    start,
    end,
    total,
    chunksize,
  };
};

const loadFile = (request, response, filDir, mediaName) => {
  const file = path.resolve(__dirname, filDir);

  fs.stat(file, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404);
      }
      return response.end(err);
    }

    const positions = getRangePositions(request.headers);

    const {
      start, end, total, chunksize,
    } = calculateRangeValues(positions, stats);

    response.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': mediaName,
    });

    const stream = fs.createReadStream(file, { start, end });

    stream.on('open', () => {
      stream.pipe(response);
    });

    stream.on('error', (streamErr) => {
      response.end(streamErr);
    });

    return stream;
  });
};

const getParty = (request, response) => {
  loadFile(request, response, '../client/party.mp4', 'video/mp4');
};

const getBling = (request, response) => {
  loadFile(request, response, '../client/bling.mp3', 'audio/mpeg');
};

const getBird = (request, response) => {
  loadFile(request, response, '../client/bird.mp4', 'video/mp4');
};

module.exports.getParty = getParty;
module.exports.getBling = getBling;
module.exports.getBird = getBird;
