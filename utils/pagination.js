const pagination = async (model, options = {}) => {
    let { page = 1, limit = 10, where = {}, orderBy = {}, include, select } = options;

    page = Math.max(parseInt(page) || 1, 1); // Ensure page is at least 1
    limit = Math.max(parseInt(limit) || 10, 1); // Ensure limit is at least 1
    const skip = (page - 1) * limit;

    const totalData = await model.count({ where });
    const data = await model.findMany({
        skip,
        take: limit,
        where,
        orderBy,
        ...(include ? { include } : {}),
        ...(select ? { select } : {})
    });

    return {
        data,
        totalData,
        totalPages: Math.ceil(totalData / limit),
        currentPage: page,
    };
};

export { pagination };
