import numpy as np

data = np.random.normal(10.0, 2.5, 1_000_000)
mean = np.mean(data)
std = np.std(data)

print(data)
print('mean:', mean)
print('std:', std)