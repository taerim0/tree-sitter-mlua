package tree_sitter_mlua_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_mlua "github.com/taerim0/tree-sitter-mlua/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_mlua.Language())
	if language == nil {
		t.Errorf("Error loading mlua grammar")
	}
}
