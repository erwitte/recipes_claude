# Recipes

A personal recipe box: users save their own recipes and organize them into themed albums.

## Language

**Recipe**:
A single dish's saved details — title, structured Ingredients, ordered Steps, an optional servings count, optional freeform notes, and an optional cover image — recorded by a user for their own reference. A Recipe may belong to zero, one, or many Albums.

**Ingredient**:
A single structured line item within a Recipe's ingredient list: a required name, with optional quantity and unit (so "salt, to taste" is representable without a separate freeform field).

**Step**:
A single ordered instruction within a Recipe's method, optionally illustrated with a photo.

**Album**:
A user-defined collection of Recipes grouped by theme, e.g. a "Christmas" album holding a Turkey recipe. Has an optional cover image. Deleting an Album removes its association with Recipes only — the Recipes themselves are never deleted.
_Avoid_: Folder, Collection, Category.

**Workspace**:
The isolated space of Recipes and Albums belonging to one user. Every user has exactly one Workspace, created automatically on first login; workspaces are not shared or visible to other users in v1.
_Avoid_: Account, Tenant.
