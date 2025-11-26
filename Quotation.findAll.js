static findAll(options = {}) {
    const db = dbManager.getDatabase();
    const { status, customer_name, model_id, created_by, date_from, date_to, page = 1, pageSize = 20 } = options;

    // 构建查询
    const builder = new QueryBuilder('quotations q')
        .leftJoin('regulations r', 'q.regulation_id = r.id')
        .leftJoin('models m', 'q.model_id = m.id')
        .leftJoin('packaging_configs pc', 'q.packaging_config_id = pc.id')
        .leftJoin('users u1', 'q.created_by = u1.id')
        .leftJoin('users u2', 'q.reviewed_by = u2.id');

    // 动态添加条件
    if (status) builder.where('q.status', '=', status);
    if (customer_name) builder.whereLike('q.customer_name', customer_name);
    if (model_id) builder.where('q.model_id', '=', model_id);
    if (created_by) builder.where('q.created_by', '=', created_by);
    if (date_from) builder.whereDate('q.created_at', '>=', date_from);
    if (date_to) builder.whereDate('q.created_at', '<=', date_to);

    // 查询总数
    const countQuery = builder.buildCount();
    const { total } = db.prepare(countQuery.sql).get(...countQuery.params);

    // 查询数据
    const offset = (page - 1) * pageSize;
    const dataQuery = builder
        .orderByDesc('q.created_at')
        .limit(pageSize)
        .offset(offset)
        .buildSelect('q.*, r.name as regulation_name, m.model_name, ...');

    const data = db.prepare(dataQuery.sql).all(...dataQuery.params);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
