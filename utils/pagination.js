
const pagination = async (model, options = {}) => {
    let { page = 1, limit = 10, where = {}, orderBy = {}, include = {} } = options;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const totalData = await model.count({ where });
    const data = await model.findMany({ skip, take: limit, where, orderBy, include });

    return {
        data,
        totalData,
        totalPages: Math.ceil(totalData / limit),
        currentPage: page,
    };
};


export { pagination };