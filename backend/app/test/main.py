import numpy as np
from app.test import ga
from time import process_time
import matplotlib.pyplot as plt

t1_start = process_time()

pop_size = 50
crossover_rate = 110
mutation_rate = 110
rate = 10

no_variables = 2
lower_bounds = [-40, -40]
upper_bounds = [40, 40]

step_size = (upper_bounds[0]-lower_bounds[0])*0.02
computing_time = 30
no_generations = 3000000080 # because we use computing time as termination criterion
pop = np.zeros((pop_size, no_variables))
for s in range(pop_size):
    for h in range(no_variables):
        pop[s,h] = np.random.uniform(lower_bounds[h],upper_bounds[h])

extended_pop = np.zeros((pop_size+crossover_rate+mutation_rate+2*no_variables*rate,pop. shape[1]))

A=[]
a=5 # adaptive restart
g=0
global_best = pop[0]
k=0
while g <= no_generations:
    for i in range(no_generations):
        offspring1 = ga.crossover(pop, crossover_rate)
        offspring2 = ga.mutation(pop, mutation_rate)
        fitness = ga.objective_function(pop)
        offspring3 = ga.local_search(pop, fitness, lower_bounds, upper_bounds, step_size,rate)
        step_size = step_size*0.98
        if step_size < (upper_bounds[0]-lower_bounds[0])*0.001:
            step_size = (upper_bounds[0]-lower_bounds[0])*0.001
        extended_pop[0:pop_size] = pop
        extended_pop[pop_size:pop_size+crossover_rate] = offspring1
        extended_pop[pop_size+crossover_rate:pop_size+crossover_rate+mutation_rate] = offspring2
        extended_pop[pop_size+crossover_rate+mutation_rate:pop_size+crossover_rate+mutation_rate+2*no_variables*rate] = offspring3
        fitness = ga.objective_function(extended_pop)
        pop = ga.selection(extended_pop,fitness,pop_size)
        print("Generation: ", g, ", Current fitness value: ", max(fitness))
        A.append(max(fitness))
        g +=1
        if i >= a:
            if sum(abs(np.diff(A[g-a:g]))) <= 0:
                index = np.argmax(fitness)
                current_best = extended_pop[index]
                pop = np.zeros((pop_size, no_variables))
                for s in range(pop_size-1):
                    for h in range(no_variables):
                        pop[s, h] = np.random.uniform(lower_bounds[h], upper_bounds[h])
                pop[pop_size-1:pop_size] = current_best
                step_size = (upper_bounds[0]-lower_bounds[0])*0.02
                global_best=np.vstack((global_best, current_best))
                break
        t1_stop = process_time()
        time_elapsed = t1_stop-t1_start
        if time_elapsed >= computing_time:
            break
    if time_elapsed >= computing_time:
        break

fitness = ga.objective_function(global_best)
index = np.argmax(fitness)
print("Best solution = ", global_best[index])
print("Best fitness value = ", max(fitness))

# Visualization
fig = plt.figure()
ax = fig.add_subplot()
fig.show()
plt.title('Evolutionary process ot the objective function vatue')
plt.xlabel("Iteration")
plt.ylabel("Ohjective function vatue")
plt.plot(A, "*", markersize=2, color="red")
plt.show()