# 🔄 ROLLBACK SCRIPT - REVERT PERFORMANCE CHANGES

Since the performance optimizations were not tested and validated, you can use this script to revert all changes if needed.

## Files Modified During Optimization

1. `src/main/resources/application.properties` - Database and thread pool configuration
2. `src/main/java/com/neeshai/backend/config/RestTemplateConfig.java` - HTTP timeout configuration
3. `src/main/resources/db/migration/V3__performance_indexes.sql` - Database performance indexes
4. `pom.xml` - Dependency modifications
5. `load-test-100-users.yml` - Load testing configuration
6. `PERFORMANCE_OPTIMIZATION_README.md` - Documentation

## Rollback Commands

### 1. Revert Application Properties
```bash
# Backup current changes
cp src/main/resources/application.properties src/main/resources/application.properties.optimized

# Revert to original (assuming you have git history)
git checkout HEAD~1 -- src/main/resources/application.properties
```

### 2. Remove New Configuration Files
```bash
# Remove RestTemplate configuration
rm src/main/java/com/neeshai/backend/config/RestTemplateConfig.java

# Remove database migration
rm src/main/resources/db/migration/V3__performance_indexes.sql

# Remove load test file
rm load-test-100-users.yml

# Remove documentation
rm PERFORMANCE_OPTIMIZATION_README.md
```

### 3. Revert POM Changes
```bash
# Backup optimized pom.xml
cp pom.xml pom.xml.optimized

# Revert to original
git checkout HEAD~1 -- pom.xml
```

### 4. Clean and Rebuild
```bash
# Clean build artifacts
mvn clean

# Rebuild with original configuration
mvn compile
```

### 5. Verify Rollback
```bash
# Check git status
git status

# Verify original configuration restored
cat src/main/resources/application.properties | head -30
```

## Complete Git Rollback (Alternative)

If you prefer to rollback everything at once:

```bash
# See recent commits
git log --oneline -10

# Revert to commit before optimizations
git reset --hard <commit-hash-before-optimizations>

# Force push if needed (CAUTION: only if you're sure)
# git push --force-with-lease origin main
```

## What Gets Reverted

### ✅ Configuration Changes Removed:
- Debug SQL logging restored to DEBUG level
- HikariCP connection pooling removed (back to defaults)
- Tomcat thread pool limits removed (back to defaults)
- RestTemplate timeout configuration removed

### ✅ Dependencies Reverted:
- Apache HttpClient dependency removed (was causing issues anyway)

### ✅ Database Changes:
- Performance indexes NOT applied (since migration never ran)
- Original schema preserved

## Original Configuration Restored

After rollback, your system will be back to:
- **Default thread pool**: 200 threads
- **Default connection pool**: Unlimited connections
- **Default timeouts**: No timeouts (potential hanging)
- **Debug logging**: Enabled (performance impact)
- **No vector indexes**: Linear scan searches

## When NOT to Rollback

Don't rollback if:
1. ✅ You successfully set up the database connection
2. ✅ The application starts without issues
3. ✅ You've tested and confirmed improvements work
4. ✅ Load testing shows actual performance gains

## When TO Rollback

Rollback immediately if:
1. ❌ Application fails to start
2. ❌ Database connection issues
3. ❌ Compilation errors appear
4. ❌ Runtime exceptions occur
5. ❌ Performance gets worse instead of better

---

**The safest approach: Keep the original working version until you can properly test these optimizations in a development environment with database access.**