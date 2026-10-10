import re

file_path = '/Users/sudhanshukumar/Desktop/Backend-code/src/models/shift.model.ts'
with open(file_path, 'r') as f:
    content = f.read()

# Add the new columns at the end of the class, before the closing brace
new_fields = """
  @Column({ type: DataType.ENUM('BASE', 'CLUBBED'), defaultValue: 'BASE' })
  type: string;

  @Column({ type: DataType.JSON, defaultValue: [] })
  baseShiftIds: string[];
"""

if 'type: string;' not in content:
    # insert before customPricing or allocations
    content = content.replace('  @HasMany(() => SeatAllocation)\n  allocations: SeatAllocation[];', 
                              new_fields + '\n  @HasMany(() => SeatAllocation)\n  allocations: SeatAllocation[];')
    
    with open(file_path, 'w') as f:
        f.write(content)
    print("Added type and baseShiftIds to Shift model.")
else:
    print("Model already updated.")
