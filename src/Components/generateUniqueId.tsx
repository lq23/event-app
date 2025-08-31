let idCounter = 0;

const generateUniqueId = (): number => {
    return Date.now() + idCounter++;
};

export default generateUniqueId;