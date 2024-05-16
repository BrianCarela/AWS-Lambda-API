const Chance = require('chance');
const chance = new Chance();

exports.handler = async (event) => {
  const movie = {
    title: chance.sentence({ words: 3 }),
    plot: chance.paragraph(),
    director: `${chance.first()} ${chance.last()}`,
    image: chance.url(),
  };
  return {
    statusCode: 200,
    body: JSON.stringify(movie),
  };
};
