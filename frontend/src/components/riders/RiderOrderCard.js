import React, { useState } from "react";
import { Card, Step, Button } from "semantic-ui-react";
import { getUnixTime, format } from "date-fns";
import Axios from "axios";

function RiderOrderCard(props) {
  const [startDatetimeToRestaurant, setStartDatetimeToRestaurant] = useState(
    //props.order.startDatetimeToRestaurant
    props.order.departdatetime1
  );
  const [endDatetimeToRestaurant, setEndDatetimeToRestaurant] = useState(
    // props.order.endDatetimeToRestaurant
    props.order.arrivedatetime
  );
  const [startDatetimeToCustomer, setStartDatetimeToCustomer] = useState(
    // props.order.startDatetimeToCustomer
    props.order.departdatetime2
  );
  const [endDatetimeToCustomer, setEndDatetimeToCustomer] = useState(
    // props.order.endDatetimeToCustomer
    props.order.deliverdatetime
  );

  const [isExpanded, setExpanded] = useState(false);

  const receiveOrderCompleted = startDatetimeToRestaurant != null;
  const goToRestaurantCompleted = endDatetimeToRestaurant != null;
  const receivedFoodCompleted = startDatetimeToCustomer != null;
  const deliverToCustomerCompleted = endDatetimeToCustomer != null;

  const updateOrderTimestamp = (type) => {
    const url = `http://localhost:5000/api/orders/${props.order.oid}`
    let timestamp = getUnixTime(new Date());
    Axios.put(url, {
      timestamp: `${timestamp}`,
      type: `${type}`
    })
      .then((response) => {
        console.log("Successfully updated status of order", response.data)
        props.refreshOrders();
      })
      .catch((error) => {
        console.log("Error occured updating order status", error)
      })
  }


  console.log(props.order);
  return (
    <Card fluid raised>
      <Card.Content>
        <Card.Header>Order {props.order.oid}: {props.order.rname}</Card.Header>
        <Card.Content style={{ float: "left" }}>
          <Card.Description>
            Time: {format(props.order.odatetime * 1000, "MM/dd/yyyy hh:mm aa")}</Card.Description>
          <Card.Description>Customer: {props.order.cname}</Card.Description>
          <Card.Description>Deliver to: {props.order.location}</Card.Description>
        </Card.Content>
        <Button
          primary
          floated="right"
          onClick={() => setExpanded(!isExpanded)}
        >
          {isExpanded ? "View less" : "View more"}
        </Button>
      </Card.Content>
      {isExpanded && (
        <>
          <Card.Content>
            <Card.Description>
              {props.order.items.map((value, index) => {
                return (
                  <div
                    key={index}
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    {`${value.qty}x ${value.fname}`}
                    <span>${(value.qty * value.price).toFixed(2)}</span>
                  </div>
                );
              })}
            </Card.Description>
          </Card.Content>
          <Card.Content>
            <Card.Description>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                Subtotal
                <span>${props.order.fprice.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                Delivery fee
                <span>${props.order.dfee.toFixed(2)}</span>
              </div>
              <br />
              <strong>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  Total
                  <span>${(props.order.fprice + props.order.dfee).toFixed(2)}</span>
                </div>
              </strong>
            </Card.Description>
          </Card.Content>
        </>
      )}
      <div>
        <Step.Group ordered widths="4">
          <Step completed={receiveOrderCompleted}>
            <Step.Content style={{ display: "flex", flexDirection: "column" }}>
              <Step.Title>Depart for Restaurant</Step.Title>
              <Button
                style={{ marginTop: "0.5em", marginRight: "0" }}
                compact
                content="Accept"
                color="green"
                onClick={() => {
                  let currentDatetime = new Date();
                  updateOrderTimestamp(1);
                  setStartDatetimeToRestaurant(getUnixTime(currentDatetime));
                }}
                disabled={receiveOrderCompleted}
              />
              {receiveOrderCompleted}

              {receiveOrderCompleted && (
                <Step.Description>
                  Completed on:{" "}
                  {format(
                    startDatetimeToRestaurant * 1000,
                    "dd/MM/yyyy HH:mm:ss"
                  )}
                </Step.Description>
              )}
            </Step.Content>
          </Step>

          <Step completed={goToRestaurantCompleted}>
            <Step.Content style={{ display: "flex", flexDirection: "column" }}>
              <Step.Title>Arrived at restaurant</Step.Title>
              <Step.Description>
                Collect customer's food from restaurant
            </Step.Description>

              {receiveOrderCompleted && (
                <Button
                  style={{ marginTop: "0.5em", marginRight: "0" }}
                  compact
                  content="Done"
                  color="green"
                  onClick={() => {
                    let currentDatetime = new Date();
                    updateOrderTimestamp(2);
                    setEndDatetimeToRestaurant(getUnixTime(currentDatetime));
                  }}
                  disabled={goToRestaurantCompleted}
                />
              )}
              {goToRestaurantCompleted && (
                <Step.Description>
                  Completed on:{" "}
                  {format(endDatetimeToRestaurant * 1000, "dd/MM/yyyy HH:mm:ss")}
                </Step.Description>
              )}
            </Step.Content>
          </Step>

          <Step completed={receivedFoodCompleted}>
            <Step.Content style={{ display: "flex", flexDirection: "column" }}>
              <Step.Title>Received food and left restaurant</Step.Title>
              <Step.Description>
                Food ready to be delivered to customer
            </Step.Description>

              {goToRestaurantCompleted && (
                <Button
                  style={{ marginTop: "0.5em", marginRight: "0" }}
                  compact
                  content="Done"
                  color="green"
                  onClick={() => {
                    let currentDatetime = new Date();
                    updateOrderTimestamp(3);
                    setStartDatetimeToCustomer(getUnixTime(currentDatetime));
                  }}
                  disabled={receivedFoodCompleted}
                />
              )}

              {receivedFoodCompleted && (
                <Step.Description>
                  Completed on:{" "}
                  {format(startDatetimeToCustomer * 1000, "dd/MM/yyyy HH:mm:ss")}
                </Step.Description>
              )}
            </Step.Content>
          </Step>

          <Step completed={deliverToCustomerCompleted}>
            <Step.Content style={{ display: "flex", flexDirection: "column" }}>
              <Step.Title>Deliver to customer</Step.Title>
              <Step.Description>Go to the customer's location</Step.Description>

              {receivedFoodCompleted && (
                <Button
                  style={{ marginTop: "0.5em", marginRight: "0" }}
                  compact
                  content="Done"
                  color="green"
                  onClick={() => {
                    let currentDatetime = new Date();
                    updateOrderTimestamp(4);
                    setEndDatetimeToCustomer(getUnixTime(currentDatetime));
                  }}
                  disabled={deliverToCustomerCompleted}
                />
              )}

              {deliverToCustomerCompleted && (
                <Step.Description>
                  Completed on:{" "}
                  {format(endDatetimeToCustomer * 1000, "dd/MM/yyyy HH:mm:ss")}
                </Step.Description>
              )}
            </Step.Content>
          </Step>
        </Step.Group>
      </div>
    </Card>
  );
}

export default RiderOrderCard;
