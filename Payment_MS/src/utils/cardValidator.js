const isDeclined = (cardHolderName) => {
  return cardHolderName.toLowerCase().includes("declined");
};

module.exports = { isDeclined };
