package com.delivery.optimization.algorithm;

import org.apache.commons.math3.linear.ArrayRealVector;
import org.apache.commons.math3.linear.MatrixUtils;
import org.apache.commons.math3.linear.RealMatrix;
import org.apache.commons.math3.linear.RealVector;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class KalmanFilterTest {

    private KalmanFilter kalmanFilter;

    @BeforeEach
    void setUp() {
        kalmanFilter = new KalmanFilter();
    }

    @Test
    void testPredict_BasicPrediction() {
        // arrange
        RealVector x = new ArrayRealVector(new double[]{0.5, 30.0, 1.0});
        RealMatrix p = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(1.0);
        KalmanFilter.ExtendedState state = KalmanFilter.ExtendedState.builder()
                .x(x)
                .p(p)
                .build();

        double dt = 1.0;
        RealMatrix q = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.01);

        // act
        KalmanFilter.ExtendedState predicted = kalmanFilter.predict(state, dt, q);

        // assert
        assertThat(predicted).isNotNull();
        assertThat(predicted.getX()).isNotNull();
        assertThat(predicted.getP()).isNotNull();

        // distance should increase by speed * dt
        assertThat(predicted.getX().getEntry(0)).isCloseTo(0.5 + 30.0 * 1.0, within(0.1));
        // speed should stay the same
        assertThat(predicted.getX().getEntry(1)).isCloseTo(30.0, within(0.01));
        // bias should decay by ALPHA_B (0.95)
        assertThat(predicted.getX().getEntry(2)).isCloseTo(1.0 * 0.95, within(0.01));
    }

    @Test
    void testPredict_WithDifferentDeltaTime() {
        // arrange
        RealVector x = new ArrayRealVector(new double[]{0.3, 25.0, 1.2});
        RealMatrix p = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.5);
        KalmanFilter.ExtendedState state = KalmanFilter.ExtendedState.builder()
                .x(x)
                .p(p)
                .build();

        double dt = 2.5;
        RealMatrix q = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.01);

        // act
        KalmanFilter.ExtendedState predicted = kalmanFilter.predict(state, dt, q);

        // assert
        assertThat(predicted.getX().getEntry(0)).isCloseTo(0.3 + 25.0 * 2.5, within(0.1));
        assertThat(predicted.getX().getEntry(1)).isCloseTo(25.0, within(0.01));
        assertThat(predicted.getX().getEntry(2)).isCloseTo(1.2 * 0.95, within(0.01));
    }

    @Test
    void testPredict_CovarianceIncreases() {
        // arrange
        RealVector x = new ArrayRealVector(new double[]{0.5, 30.0, 1.0});
        RealMatrix p = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.1);
        KalmanFilter.ExtendedState state = KalmanFilter.ExtendedState.builder()
                .x(x)
                .p(p)
                .build();

        double dt = 1.0;
        RealMatrix q = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.05);

        // act
        KalmanFilter.ExtendedState predicted = kalmanFilter.predict(state, dt, q);

        // assert - covariance should increase (uncertainty grows over time)
        double initialTrace = state.getP().getTrace();
        double predictedTrace = predicted.getP().getTrace();
        assertThat(predictedTrace).isGreaterThan(initialTrace);
    }

    @Test
    void testUpdate_ReducesUncertainty() {
        // arrange
        RealVector x = new ArrayRealVector(new double[]{0.5, 30.0, 1.0});
        RealMatrix p = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(1.0);
        KalmanFilter.ExtendedState state = KalmanFilter.ExtendedState.builder()
                .x(x)
                .p(p)
                .build();

        double distMeasured = 0.52;
        double speedMeasured = 31.0;
        double rDist = 0.01;
        double rSpeed = 0.1;

        // act
        KalmanFilter.ExtendedState updated = kalmanFilter.update(state, distMeasured, speedMeasured, rDist, rSpeed);

        // assert - covariance should decrease (uncertainty reduced by measurement)
        double initialTrace = state.getP().getTrace();
        double updatedTrace = updated.getP().getTrace();
        assertThat(updatedTrace).isLessThan(initialTrace);
    }

    @Test
    void testUpdate_CorrectsMeasurement() {
        // arrange
        RealVector x = new ArrayRealVector(new double[]{0.5, 30.0, 1.0});
        RealMatrix p = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.5);
        KalmanFilter.ExtendedState state = KalmanFilter.ExtendedState.builder()
                .x(x)
                .p(p)
                .build();

        double distMeasured = 0.55;
        double speedMeasured = 32.0;
        double rDist = 0.01;
        double rSpeed = 0.1;

        // act
        KalmanFilter.ExtendedState updated = kalmanFilter.update(state, distMeasured, speedMeasured, rDist, rSpeed);

        // assert - state should move toward measurements
        assertThat(updated.getX().getEntry(0)).isGreaterThan(state.getX().getEntry(0));
        assertThat(updated.getX().getEntry(0)).isLessThanOrEqualTo(distMeasured);
        assertThat(updated.getX().getEntry(1)).isGreaterThan(state.getX().getEntry(1));
        assertThat(updated.getX().getEntry(1)).isLessThanOrEqualTo(speedMeasured);
    }

    @Test
    void testUpdate_WithHighMeasurementNoise() {
        // arrange
        RealVector x = new ArrayRealVector(new double[]{0.5, 30.0, 1.0});
        RealMatrix p = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.1);
        KalmanFilter.ExtendedState state = KalmanFilter.ExtendedState.builder()
                .x(x)
                .p(p)
                .build();

        double distMeasured = 0.8;  // Very different from state
        double speedMeasured = 50.0;
        double rDist = 10.0;  // High measurement noise
        double rSpeed = 10.0;

        // act
        KalmanFilter.ExtendedState updated = kalmanFilter.update(state, distMeasured, speedMeasured, rDist, rSpeed);

        // assert - with high measurement noise, state should trust measurements less
        assertThat(updated.getX().getEntry(0)).isCloseTo(state.getX().getEntry(0), within(0.3));
        assertThat(updated.getX().getEntry(1)).isCloseTo(state.getX().getEntry(1), within(10.0));
    }

    @Test
    void testUpdate_WithLowMeasurementNoise() {
        // arrange
        RealVector x = new ArrayRealVector(new double[]{0.5, 30.0, 1.0});
        RealMatrix p = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(1.0);
        KalmanFilter.ExtendedState state = KalmanFilter.ExtendedState.builder()
                .x(x)
                .p(p)
                .build();

        double distMeasured = 0.6;
        double speedMeasured = 35.0;
        double rDist = 0.001;  // Low measurement noise
        double rSpeed = 0.01;

        // act
        KalmanFilter.ExtendedState updated = kalmanFilter.update(state, distMeasured, speedMeasured, rDist, rSpeed);

        // assert - with low measurement noise, state should trust measurements more
        assertThat(updated.getX().getEntry(0)).isCloseTo(distMeasured, within(0.1));
        assertThat(updated.getX().getEntry(1)).isCloseTo(speedMeasured, within(1.0));
    }

    @Test
    void testPredictUpdateCycle_ConsistentState() {
        // arrange - simulate a full predict-update cycle
        RealVector x = new ArrayRealVector(new double[]{0.3, 25.0, 1.0});
        RealMatrix p = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.5);
        KalmanFilter.ExtendedState state = KalmanFilter.ExtendedState.builder()
                .x(x)
                .p(p)
                .build();

        double dt = 1.0;
        RealMatrix q = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.01);

        // act - predict
        KalmanFilter.ExtendedState predicted = kalmanFilter.predict(state, dt, q);

        // act - update with measurement
        double distMeasured = 0.32;
        double speedMeasured = 26.0;
        KalmanFilter.ExtendedState updated = kalmanFilter.update(predicted, distMeasured, speedMeasured, 0.01, 0.1);

        // assert
        assertThat(updated.getX()).isNotNull();
        assertThat(updated.getP()).isNotNull();
        assertThat(updated.getX().getDimension()).isEqualTo(3);
        assertThat(updated.getP().getRowDimension()).isEqualTo(3);
        assertThat(updated.getP().getColumnDimension()).isEqualTo(3);
    }

    @Test
    void testMultiplePredictUpdateCycles() {
        // arrange
        RealVector x = new ArrayRealVector(new double[]{0.0, 20.0, 1.0});
        RealMatrix p = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(1.0);
        KalmanFilter.ExtendedState state = KalmanFilter.ExtendedState.builder()
                .x(x)
                .p(p)
                .build();

        double dt = 1.0;
        RealMatrix q = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.01);

        // act - run 5 cycles
        for (int i = 0; i < 5; i++) {
            state = kalmanFilter.predict(state, dt, q);
            double distMeasured = state.getX().getEntry(0) + 0.05;
            double speedMeasured = 22.0 + i;
            state = kalmanFilter.update(state, distMeasured, speedMeasured, 0.01, 0.1);
        }

        // assert - state should have progressed
        assertThat(state.getX().getEntry(0)).isGreaterThan(0.0);
        assertThat(state.getX().getEntry(1)).isGreaterThan(20.0);
        // Covariance should stabilize
        assertThat(state.getP().getTrace()).isLessThan(5.0);
    }

    @Test
    void testPredict_BiasDecay() {
        // arrange
        RealVector x = new ArrayRealVector(new double[]{0.5, 30.0, 2.0});  // High initial bias
        RealMatrix p = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.5);
        KalmanFilter.ExtendedState state = KalmanFilter.ExtendedState.builder()
                .x(x)
                .p(p)
                .build();

        double dt = 1.0;
        RealMatrix q = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.01);

        // act - run multiple predictions to see bias decay
        KalmanFilter.ExtendedState current = state;
        for (int i = 0; i < 10; i++) {
            current = kalmanFilter.predict(current, dt, q);
        }

        // assert - bias should have decayed significantly
        double expectedBias = 2.0 * Math.pow(0.95, 10);
        assertThat(current.getX().getEntry(2)).isCloseTo(expectedBias, within(0.01));
    }

    @Test
    void testUpdate_BiasNotDirectlyMeasured() {
        // arrange
        RealVector x = new ArrayRealVector(new double[]{0.5, 30.0, 1.5});
        RealMatrix p = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.5);
        KalmanFilter.ExtendedState state = KalmanFilter.ExtendedState.builder()
                .x(x)
                .p(p)
                .build();

        double distMeasured = 0.55;
        double speedMeasured = 32.0;
        double rDist = 0.01;
        double rSpeed = 0.1;

        // act
        KalmanFilter.ExtendedState updated = kalmanFilter.update(state, distMeasured, speedMeasured, rDist, rSpeed);

        // assert - bias should remain relatively stable since it's not directly measured
        assertThat(updated.getX().getEntry(2)).isCloseTo(state.getX().getEntry(2), within(0.5));
    }

    @Test
    void testPredict_ZeroDeltaTime() {
        // arrange
        RealVector x = new ArrayRealVector(new double[]{0.5, 30.0, 1.0});
        RealMatrix p = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.5);
        KalmanFilter.ExtendedState state = KalmanFilter.ExtendedState.builder()
                .x(x)
                .p(p)
                .build();

        double dt = 0.0;
        RealMatrix q = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.01);

        // act
        KalmanFilter.ExtendedState predicted = kalmanFilter.predict(state, dt, q);

        // assert - state should not change much except bias decay
        assertThat(predicted.getX().getEntry(0)).isCloseTo(state.getX().getEntry(0), within(0.01));
        assertThat(predicted.getX().getEntry(1)).isCloseTo(state.getX().getEntry(1), within(0.01));
    }

    @Test
    void testUpdate_IdentityMeasurement() {
        // arrange
        RealVector x = new ArrayRealVector(new double[]{0.5, 30.0, 1.0});
        RealMatrix p = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.5);
        KalmanFilter.ExtendedState state = KalmanFilter.ExtendedState.builder()
                .x(x)
                .p(p)
                .build();

        // Measure exactly what the state predicts
        double distMeasured = 0.5;
        double speedMeasured = 30.0;
        double rDist = 0.01;
        double rSpeed = 0.1;

        // act
        KalmanFilter.ExtendedState updated = kalmanFilter.update(state, distMeasured, speedMeasured, rDist, rSpeed);

        // assert - state should remain close to original since measurement matches
        assertThat(updated.getX().getEntry(0)).isCloseTo(0.5, within(0.01));
        assertThat(updated.getX().getEntry(1)).isCloseTo(30.0, within(0.1));
    }

    @Test
    void testCovarianceMatrixSymmetry() {
        // arrange
        RealVector x = new ArrayRealVector(new double[]{0.5, 30.0, 1.0});
        RealMatrix p = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.5);
        KalmanFilter.ExtendedState state = KalmanFilter.ExtendedState.builder()
                .x(x)
                .p(p)
                .build();

        double dt = 1.0;
        RealMatrix q = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.01);

        // act
        KalmanFilter.ExtendedState predicted = kalmanFilter.predict(state, dt, q);
        KalmanFilter.ExtendedState updated = kalmanFilter.update(predicted, 0.52, 31.0, 0.01, 0.1);

        // assert - covariance matrices should be symmetric
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {
                assertThat(predicted.getP().getEntry(i, j))
                        .isCloseTo(predicted.getP().getEntry(j, i), within(1e-10));
                assertThat(updated.getP().getEntry(i, j))
                        .isCloseTo(updated.getP().getEntry(j, i), within(1e-10));
            }
        }
    }

    @Test
    void testCovarianceMatrixPositiveDefinite() {
        // arrange
        RealVector x = new ArrayRealVector(new double[]{0.5, 30.0, 1.0});
        RealMatrix p = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.5);
        KalmanFilter.ExtendedState state = KalmanFilter.ExtendedState.builder()
                .x(x)
                .p(p)
                .build();

        double dt = 1.0;
        RealMatrix q = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.01);

        // act
        KalmanFilter.ExtendedState predicted = kalmanFilter.predict(state, dt, q);
        KalmanFilter.ExtendedState updated = kalmanFilter.update(predicted, 0.52, 31.0, 0.01, 0.1);

        // assert - diagonal elements should be positive
        for (int i = 0; i < 3; i++) {
            assertThat(predicted.getP().getEntry(i, i)).isGreaterThan(0.0);
            assertThat(updated.getP().getEntry(i, i)).isGreaterThan(0.0);
        }
    }
}
