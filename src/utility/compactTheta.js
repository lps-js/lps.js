const Variable = require('../engine/Variable');

module.exports = function compactTheta(theta1, theta2) {
 let theta = {};
 Object.keys(theta1).forEach((key) => {
   let substitution = theta1[key];
   while (substitution instanceof Variable && theta2[substitution.evaluate()] !== undefined) {
     if (theta2[substitution.evaluate()] instanceof Variable
         && substitution.evaluate() === theta2[substitution.evaluate()].evaluate()) {
       break;
     }
     substitution = theta2[substitution.evaluate()];
   }
   theta[key] = substitution;
 });
 Object.keys(theta2).forEach((key) => {
   let substitution = theta2[key];
   theta[key] = substitution;
 });
 return theta;
};
