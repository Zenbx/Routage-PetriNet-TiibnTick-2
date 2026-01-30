package com.delivery.optimization.algorithm;

import lombok.Builder;
import lombok.Data;
import org.apache.commons.math3.linear.*;
import org.springframework.stereotype.Component;

@Component
public class KalmanFilter {

    @Data
    @Builder
    public static class ExtendedState {
        private RealVector x; // [distance, speed, bias]
        private RealMatrix p; // covariance matrix
    }

    // Section 3.6.2 - Matrices de base
    private static final double ALPHA_B = 0.95; // Bias decay factor

    /**
     * Prediction step: x_k|k-1 = F * x_k-1, P_k|k-1 = F * P_k-1 * F^T + Q
     */
    public ExtendedState predict(ExtendedState state, double dt, RealMatrix q) {
        // F matrix as defined in eq. 3.7
        RealMatrix f = new Array2DRowRealMatrix(new double[][] {
                { 1.0, dt, 0.0 },
                { 0.0, 1.0, 0.0 },
                { 0.0, 0.0, ALPHA_B }
        });

        RealVector predictedX = f.operate(state.getX());
        RealMatrix predictedP = f.multiply(state.getP()).multiply(f.transpose()).add(q);

        return ExtendedState.builder()
                .x(predictedX)
                .p(predictedP)
                .build();
    }

    /**
     * Update step: x_k|k = x_k|k-1 + K(z - H*x_k|k-1)
     */
    public ExtendedState update(ExtendedState state, double distMeasured, double speedMeasured, double rDist,
            double rSpeed) {
        // H matrix: Observe distance and speed
        RealMatrix h = new Array2DRowRealMatrix(new double[][] {
                { 1.0, 0.0, 0.0 },
                { 0.0, 1.0, 0.0 }
        });

        RealVector z = new ArrayRealVector(new double[] { distMeasured, speedMeasured });
        RealMatrix r = new Array2DRowRealMatrix(new double[][] {
                { rDist, 0.0 },
                { 0.0, rSpeed }
        });

        // Innovation y = z - Hx
        RealVector y = z.subtract(h.operate(state.getX()));

        // S = HPH^T + R
        RealMatrix s = h.multiply(state.getP()).multiply(h.transpose()).add(r);

        // K = PH^T * S^-1
        RealMatrix k = state.getP().multiply(h.transpose()).multiply(new LUDecomposition(s).getSolver().getInverse());

        // Updated state x = x + Ky
        RealVector updatedX = state.getX().add(k.operate(y));

        // Updated covariance P = (I - KH) * P
        RealMatrix i = MatrixUtils.createRealIdentityMatrix(3);
        RealMatrix updatedP = i.subtract(k.multiply(h)).multiply(state.getP());

        return ExtendedState.builder()
                .x(updatedX)
                .p(updatedP)
                .build();
    }
}
