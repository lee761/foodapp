const db = require('../db')

// @desc    Get all orders
// @route   GET /orders
// @acess   Public
exports.getOrders = async (req, response) => {
    const rows = await db.query('SELECT * FROM orders', (err, result) => {
        if (err) {
            console.error(err.stack);
            throw err
        } else {
            if (!result.rows[0]) {
                response.status(404).json(`Failed to get all orders. There could be no order yet.`)
            } else {
                console.log('Successfully get all orders')
                response.status(200).json(result.rows)
            }
        }
    })

}

// @desc    Get single orders
// @route   GET /orders/:oid
// @acess   Public
exports.getOrder = async (req, response) => {
    const oid = req.params.oid
    const row = await db.query('SELECT * FROM orders WHERE oid = $1', [oid], (err, result) => {
        if (err) {
            console.error(err.stack)
            throw err
        } else {
            if (!result.rows[0]) {
                response.status(404).json(`Failed to get order ${id}. Order does not exist.`)
            } else {
                console.log(`Successfully get order with oid ${oid}`)
                response.status(200).json(result.rows[0])
            }
        }
    })
}

// @desc    Create new order
// @route   POST /orders
// @acess   Private
exports.createOrder = async (req, response) => {
    //TODO: Check that order reaches minimum amount
    //TODO: Check that customer can only pay by card if customer has a card

    const { location, dfee, odatetime, paymethod, cid, rname, foodlist, fprice, rid } = req.body;
    const createOrderQuery = `INSERT INTO Orders (location, dfee, status, fprice, odatetime, paymethod, cid, rname, rid)
    VALUES(${location}, ${dfee}, 0, ${fprice}, ${odatetime}, ${paymethod}, ${cid}, ${rname}, ${rid}) RETURNING *`

    await db.query(createOrderQuery, (err, result) => {
        if (err) {
            console.error(err.stack)
            response.status(404).json(`Failed to create new order: Min amount not met`)
        } else {
            if (!result.rows) {
                response.status(404).json(`Failed to create new order.`)
            } else {
                console.log('Successfully created order')
                console.log(result)
                oid = result.rows[0].oid
                console.log('Order id = ', oid)
                for (var i = 0; i < foodlist.length; i += 1) {
                    var food = foodlist[i]
                    console.log("Food:", food)
                    db.query(`INSERT INTO Consists (oid, fname, quantity, itemprice) VALUES (${oid}, ${food.fname}, ${food.qty}, ${food.itemprice})
                        returning *;`, (err, result2) => {
                        if (err) {
                            console.log("Some error occured for adding ", food.fname)
                            console.log(err.stack)
                        } else {
                            console.log("Added item to Consists:")
                            console.log(result2.rows)
                        }
                    })
                }
                response.status(200).json({ msg: `Successfully created order with oid ${oid}` })
            }
        }
    });

}

const getFieldAndStatus = (type) => {
    switch (type) {
        case '1':
            return {
                field: 'departdatetime1',
                status: 1
            }
            break;
        case '2':
            return {
                field: 'arrivedatetime',
                status: 1
            }
            break;
        case '3':
            return {
                field: 'departdatetime2',
                status: 1
            }
            break;
        case '4':
            return {
                field: 'deliverdatetime',
                status: 2
            }
            break;
        default:
            return {
                field: '',
                status: 0
            }
    }
}

// @desc    Update the timings for the orders
// @route   PUT /orders/:oid
// @acess   Private
exports.updateOrderTime = async (req, response) => {
    const id = req.params.id
    /*
    Timing types: 1-> Depart for restaurant, 2-> Arrive at restaurant. 3-> Depart from restaurant, 4-> Arrive at delivery location
    */
    let timestamp = req.body.timestamp
    let type = req.body.type

    console.log(getFieldAndStatus(type))

    let field = getFieldAndStatus(type).field
    let status = getFieldAndStatus(type).status

    console.log("field:", field)
    console.log("status:", status)

    // TODO: handle update of variable number of fields
    const row = await db.query(`UPDATE orders SET ${field} = ${timestamp}, status = ${status} WHERE oid = ${id} returning *`, (err, result) => {
        if (err) {
            console.error(err.stack)
            response.status(404).json(`Failed to update order ${id}. Order does not exist.`)
        } else {
            if (!result.rows[0]) {
                response.status(404).json(`Failed to update order ${id}. Order does not exist.`)
            } else {
                console.log(`Successfully updated order with oid ${id}`)
                response.status(200).json({ msg: `Successfully updated order ${id} timestamp and status`, order: result.rows[0] })
            }
        }
    })
}

// @desc    Delete order
// @route   DELETE /orders/:oid
// @acess   Private
exports.deleteOrder = async (req, response) => {
    const oid = req.params.oid
    const row = await db.query('DELETE FROM orders WHERE oid = $1', [oid], (err, result) => {
        if (err) {
            console.error(err.stack)
            throw err
        } else {
            // TODO: detect case and handle when nothing is deleted

            console.log(`Successfully deleted order with oid ${oid}`)
            response.status(200).json(`Successfully deleted order with oid ${oid}`)
        }
    })
}

// // @desc    Get all eligible riders for the order (ie. order falls in rider's work schedule)
// // @route   GET /riders?time=:time
// // @access   Private
// exports.getEligibleRiders = async (req, response) => {
//     const odatetime = req.query.time

//     // Query to get all processing orders that fall in rider's work schedule
//     const getEligibleRidersQuery =
//         `SELECT cst.id
//             FROM CombinedScheduleTable cst
//             WHERE cst.timerange @> EXTRACT(HOUR from to_timestamp(${odatetime}))::int4
//             AND cst.sc_date = date_trunc('day', to_timestamp(${odatetime}))::date
//             ORDER BY cst.id ASC;`

//     const rows = await db.query(getEligibleRidersQuery, async (err, result) => {
//         if (err) {
//             console.error(err.stack);
//             response.status(404).json(`Failed to get eligible riders.`)
//         } else {
//             console.log(result.rows)
//             let allEligibleRiders = []
//             result.rows.forEach(item => {
//                 allEligibleRiders.push(item.id)
//             })
//             response.status(200).json({ 'rid': allEligibleRiders })
//         }
//     })
// }

// exports.getEligibleRiders = async (req, response) => {
//     const oid = req.params.id

//     // Query to get all processing orders that fall in rider's work schedule
//     const getEligibleRidersQuery =
//         `SELECT cst.id
//       FROM CombinedScheduleTable cst
//       WHERE EXISTS (
//         SELECT 1
//           FROM Orders o
//           WHERE o.oid = ${oid}
//           AND cst.timerange @> EXTRACT(HOUR from to_timestamp(O.odatetime))::int4
//           AND cst.sc_date = date_trunc('day', to_timestamp(O.odatetime))::date  
//       )
//       ORDER BY cst.id ASC;`

//     const rows = await db.query(getEligibleRidersQuery, async (err, result) => {
//         if (err) {
//             console.error(err.stack);
//             response.status(404).json(`Failed to get eligible riders.`)
//         } else {
//             console.log(result.rows)
//             let allEligibleRiders = []
//             result.rows.forEach(item => {
//                 allEligibleRiders.push(item.id)
//             })
//             response.status(200).json({ 'rid': allEligibleRiders })
//         }
//     })
// }