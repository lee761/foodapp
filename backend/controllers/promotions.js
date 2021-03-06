const db = require('../db')

// @desc    Get all FDS promotions
// @route   GET /promotions
// @acess   Public
exports.getFDSPromotions = async (req, response) => {
    const getPromotionQuery =
        `SELECT json_build_object(
    'pid', pid,
    'sdatetime', sdatetime,
    'edatetime', edatetime,
    'discount', discount
    )
    AS promo
    FROM Promotions NATURAL JOIN FDSPromotions
    ;`

    const rows = await db.query(getPromotionQuery, (err, result) => {
        if (err) {
            console.error(err.stack);
            throw err
        } else {
            if (!result.rows[0]) {
                response.status(404).json(`Failed to get all Promotions.`)
            } else {
                console.log('Successfully get all promotions')
                // console.log("Result", result.rows)
                response.status(200).json(result.rows)
            }
        }
    })
}

// @desc    Create new FDS promotion
// @route   POST /promotions
// @acess   Private
exports.createFDSPromotion = async (req, response) => {
    const { sdatetime, edatetime, discount } = req.body;
    const createPromotionQuery =
        `BEGIN;

      SET CONSTRAINTS ALL DEFERRED;
      INSERT INTO Promotions (sdatetime, edatetime, discount)
      VALUES(${sdatetime}, ${edatetime}, ${discount}) RETURNING *;

      INSERT INTO FDSPromotions
      VALUES((SELECT currval('promotions_pid_seq'))) RETURNING *;

      COMMIT;`

    const rows = await db.query(createPromotionQuery, (err, result) => {
        if (err) {
            console.error("Error creating promotion", err.stack)
            response.status(500).json(`Failed to create new promotion.`)
        }
        else {
            console.log("Result", result[2].rows, result[3].rows)
            if (result[2].rows.pid == result[3].rows.pid) {
                response.status(200).json(`Successfully created promotion.`)
            }
        }
    })
}

exports.orderDiscount = async (req, response) => {
    const { pid, oid, cid } = req.body;

    // frontend check that sdatetime <= odatetime <= edatetime 
    const orderDiscountQuery =
        `INSERT INTO FDSOffers
        SELECT * FROM
        (SELECT ${pid}, ${oid}) AS tmp
        WHERE EXISTS (SELECT oid FROM Orders WHERE cid = ${cid}
            AND oid = ${oid}) RETURNING *`

    const checkOutPriceQuery =
        `SELECT F.oid, (O.dfee + O.fprice) AS total, P.discount 
        FROM (Orders O JOIN FDSOffers F USING (oid)) 
        JOIN Promotions P USING (pid)
        WHERE oid = ${oid} `

    const rows = await db.query(orderDiscountQuery, (err, result) => {
        if (err) {
            console.log(err.stack)
            response.status(500).json('Failed to apply promotion.')
        } else {
            db.query(checkOutPriceQuery, (err1, result1) => {
                if (err1) {
                    console.log(err1.stack)
                    response.status(500).json('Failed to apply promotion.')
                } else {
                    console.log("Result:", result.rows, "Result1:", result1.rows)
                    response.status(200).json('Promotion applied to order.')
                    const checkOutPrice = result1.rows[0].total * (1 - result1.rows[0].discount)
                    console.log(checkOutPrice)
                }
            })
        }
    })
}

// const getCustomerWithOfferQuery =
// @desc    Get customers who have not placed order for last 3 months
// @route   GET /promotions/customers
// @acess   Public
exports.getCustomers = async (req, response) => {
    const getCustomerQuery =
        `SELECT json_build_object(
    'cid', U.id,
    'name', U.name
    )
    AS customer
    FROM Orders O join Users U on (O.cid = U.id)
    WHERE oid IN (SELECT oid FROM Orders
        WHERE (SELECT EXTRACT(epoch from now())) -
        odatetime >= 3 * 2592000)
    ;`

    const rows = await db.query(getCustomerQuery, (err, result) => {
        if (err) {
            console.error(err.stack);
            throw err
        } else {
            if (!result.rows[0]) {
                response.status(404).json(`Failed to get customers.`)
            } else {
                console.log('Successfully get customers')
                // console.log("Result", result.rows)
                response.status(200).json(result.rows)
            }
        }
    })
}

// @desc    Get all promotions of a restaurant
// @route   GET /promotions/:rname
// @acess   Public
exports.getRPromotions = async (req, response) => {
    const rname = req.params.rname
    const getPromotionQuery =
        `SELECT json_build_object(
    'pid', pid,
    'fname', fname,
    'sdatetime', sdatetime,
    'edatetime', edatetime,
    'discount', discount
    )
    AS rpromo
    FROM Promotions NATURAL JOIN Offers
    WHERE rname = ${rname}
    ;`

    const rows = await db.query(getPromotionQuery, (err, result) => {
        if (err) {
            console.error(err.stack);
            throw err
        } else {
            if (!result.rows[0]) {
                response.status(404).json({ success: false, msg: `Failed to get Restaurant Promotions.` })
            } else {
                console.log('Successfully get promotions')
                // console.log("Result", result.rows)
                response.status(200).json(result.rows)
            }
        }
    })
}

// @desc    Create new Restaurant promotion
// @route   POST /promotions/:rname
// @acess   Private
exports.createRPromotion = async (req, response) => {
    const { sdatetime, edatetime, discount, fname } = req.body;
    const rname = req.params.rname
    const createPromotionQuery =
        `BEGIN;

      SET CONSTRAINTS ALL DEFERRED;
      INSERT INTO Promotions (sdatetime, edatetime, discount)
      VALUES(${sdatetime}, ${edatetime}, ${discount}) RETURNING *;

      INSERT INTO RPromotions
      VALUES((SELECT currval('promotions_pid_seq'))) RETURNING *;

      INSERT INTO Offers
      VALUES((SELECT currval('promotions_pid_seq')), ${rname}, ${fname}) RETURNING *;

      COMMIT;`

    const rows = await db.query(createPromotionQuery, (err, result) => {
        if (err) {
            console.error("Error creating promotion", err.stack)
            response.status(500).json({ success: false, msg: `Failed to create new promotion.` })
        }
        else {
            console.log("Result", result[2].rows, result[3].rows)
            if (result[2].rows.pid == result[3].rows.pid) {
                response.status(200).json({ success: true, msg: `Successfully created promotion.` })
            }
        }
    })
}